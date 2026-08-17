import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { clientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sets balance back to exactly 0 via an ADJUSTMENT transaction (not a
// destructive UPDATE with no trail) — so a reset is just a very large
// adjustment, fully visible in wallet history like every other change.
export async function POST(req: NextRequest) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Reset ví về 0 bởi Super Admin";

    if (!userId) return jsonError("Thiếu người dùng.", 400);

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    if (Number(wallet.balance) === 0) {
      return jsonError("Ví này đã có số dư bằng 0.", 400);
    }

    const delta = -Number(wallet.balance);
    const oldBalance = wallet.balance;

    const [updatedWallet, walletTx] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: delta } } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADJUSTMENT",
          status: "COMPLETED",
          amount: delta,
          oldBalance,
          newBalance: 0,
          note: reason,
          ipAddress: clientIp(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
          reviewedById: actingUser.sub,
          reviewedAt: new Date()
        }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId,
        type: "WALLET",
        title: "Số dư ví đã được reset",
        body: `Quản trị viên đã đặt lại số dư ví của bạn về 0đ. Lý do: ${reason}`
      }
    });

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_RESET_WALLET", metadata: { targetUserId: userId, oldBalance: Number(oldBalance), reason } }
    });

    return jsonOk({ wallet: updatedWallet, transaction: walletTx });
  } catch (error) {
    return handleApiError(error, "admin/wallet/reset:POST");
  }
}
