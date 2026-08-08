import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { clientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const amount = Number(body?.amount);
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!userId) return jsonError("Thiếu người dùng.", 400);
    if (!Number.isFinite(amount) || amount === 0) {
      return jsonError("Số tiền điều chỉnh phải khác 0.", 422);
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    if (amount < 0 && Number(wallet.balance) + amount < 0) {
      return jsonError("Số dư hiện tại không đủ để trừ số tiền này.", 400);
    }

    const oldBalance = wallet.balance;

    const [, tx] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADJUSTMENT",
          status: "COMPLETED",
          amount,
          oldBalance,
          // newBalance is resolved from the same increment, computed here
          // rather than re-read, so it's exact even under concurrent writes.
          newBalance: Number(oldBalance) + amount,
          note: note ?? `Điều chỉnh thủ công bởi quản trị viên`,
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
        title: "Số dư ví đã được điều chỉnh",
        body: `Quản trị viên đã ${amount > 0 ? "cộng" : "trừ"} ${Math.abs(amount).toLocaleString("vi-VN")}đ vào ví của bạn.`
      }
    });

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_WALLET_ADJUST", metadata: { targetUserId: userId, amount, note } }
    });

    return jsonOk({ transaction: tx }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/wallet/adjust:POST");
  }
}
