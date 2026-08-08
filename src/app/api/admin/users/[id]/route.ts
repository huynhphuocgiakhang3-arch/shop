import { NextRequest } from "next/server";
import type { Role, MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
const TIERS = ["FREE", "SILVER", "GOLD", "DIAMOND"] as const;

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        membershipTier: true,
        rewardPoints: true,
        isBanned: true,
        isDeleted: true,
        emailVerifiedAt: true,
        createdAt: true,
        wallet: { select: { balance: true, pendingBalance: true, bonusBalance: true } },
        _count: { select: { orders: true, reviews: true, supportTickets: true } }
      }
    });

    if (!user) return jsonError("Không tìm thấy người dùng.", 404);
    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error, "admin/users/[id]:GET");
  }
}

// This entire mutation surface — role changes, membership changes, and
// ban/unban — is deliberately SUPER_ADMIN-only per the platform's access
// model. A plain ADMIN can view the user (GET above) but never alter their
// account standing.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user: actingUser, response } = await requireSuperAdmin();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const rawRole = body?.role;
  const rawTier = body?.membershipTier;
  const isBanned = body?.isBanned as boolean | undefined;

  if (rawRole !== undefined && !isRole(rawRole)) {
    return jsonError("Vai trò không hợp lệ.", 422);
  }
  if (rawTier !== undefined && !isMembershipTier(rawTier)) {
    return jsonError("Hạng thành viên không hợp lệ.", 422);
  }
  const role: Role | undefined = isRole(rawRole) ? rawRole : undefined;
  const membershipTier: MembershipTier | undefined = isMembershipTier(rawTier) ? rawTier : undefined;

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) return jsonError("Không tìm thấy người dùng.", 404);

  // A SUPER_ADMIN can't demote/ban themselves into a locked-out state by
  // accident through this endpoint — self-management stays in Settings.
  if (targetUser.id === actingUser.sub && (role || isBanned)) {
    return jsonError("Không thể tự thay đổi vai trò hoặc khóa chính tài khoản của bạn.", 400);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      role: role ?? undefined,
      membershipTier: membershipTier ?? undefined,
      isBanned: isBanned ?? undefined,
      bannedAt: isBanned === true ? new Date() : isBanned === false ? null : undefined
    },
    select: { id: true, email: true, displayName: true, role: true, membershipTier: true, isBanned: true }
  });

  if (isBanned === true) {
    await prisma.refreshToken.updateMany({
      where: { userId: params.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: actingUser.sub,
      action: "ADMIN_UPDATE_USER",
      metadata: { targetUserId: params.id, role, membershipTier, isBanned }
    }
  });

  return jsonOk({ user: updated });
}

// Soft delete, SUPER_ADMIN only.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    if (params.id === actingUser.sub) {
      return jsonError("Không thể tự xóa chính tài khoản của bạn.", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) return jsonError("Không tìm thấy người dùng.", 404);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.id },
        data: { isDeleted: true, deletedAt: new Date(), email: `deleted+${params.id}@khanghuynh.vault` }
      }),
      prisma.refreshToken.updateMany({ where: { userId: params.id, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_DELETE_USER", metadata: { targetUserId: params.id } }
    });

    return jsonOk({ message: "Đã xóa người dùng." });
  } catch (error) {
    return handleApiError(error, "admin/users/[id]:DELETE");
  }
}
