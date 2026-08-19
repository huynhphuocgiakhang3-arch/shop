import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Excludes visually-ambiguous characters (0/O, 1/I/L) so a code read aloud
// or typed from a screenshot can't be misentered.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(length = 7): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/**
 * Returns the user's referral code, generating and persisting one on first
 * call if they don't have one yet (existing accounts created before this
 * feature shipped never went through a migration backfill — they get a
 * code the first time they open the referral center or hit the API).
 * Collision-safe via the DB unique constraint + a small retry loop.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    try {
      const updated = await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return updated.referralCode as string;
    } catch (error) {
      // Unique constraint hit — extremely unlikely at 7 chars from a
      // 31-symbol alphabet, but retry with a fresh code rather than fail.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

/** Looks up the referrer (if any) for a raw referral code from a signup link. Case-insensitive. */
export async function findReferrerByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return prisma.user.findUnique({ where: { referralCode: normalized }, select: { id: true, displayName: true } });
}
