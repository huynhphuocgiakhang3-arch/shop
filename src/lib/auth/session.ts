import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, type JwtPayload } from "./jwt";

/**
 * Reads and verifies the access-token cookie for the current request.
 * Returns null (never throws) if missing/expired/invalid — callers decide
 * whether that's a 401 or just "anonymous".
 *
 * NOTE: `payload.role` here comes from the JWT claim, which can be up to
 * ACCESS_TOKEN_TTL (15 minutes) stale after an admin changes a user's role
 * directly in the database. Anything that needs the role to be authoritative
 * (RBAC checks, admin gating) must use `getFreshSessionUser` instead.
 */
export async function getSessionUser(): Promise<JwtPayload | null> {
  const token = cookies().get("access_token")?.value;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export interface FreshSessionUser extends JwtPayload {
  isBanned: boolean;
  isDeleted: boolean;
}

/**
 * Same as `getSessionUser`, but re-reads the user's role/ban/delete status
 * straight from Postgres instead of trusting the (possibly stale) JWT claim.
 * This is what makes a role change in Neon apply on the very next
 * request/refresh — not after the access token expires — and is what every
 * RBAC-sensitive check (admin guards, admin layout, maintenance-mode bypass)
 * should use.
 */
export async function getFreshSessionUser(): Promise<FreshSessionUser | null> {
  const base = await getSessionUser();
  if (!base) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: base.sub },
    select: { role: true, isBanned: true, isDeleted: true }
  });

  if (!dbUser || dbUser.isDeleted) return null;

  return { sub: base.sub, role: dbUser.role, isBanned: dbUser.isBanned, isDeleted: dbUser.isDeleted };
}
