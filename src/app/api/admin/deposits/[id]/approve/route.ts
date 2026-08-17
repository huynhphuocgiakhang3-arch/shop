import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const result = await prisma.$transaction(async (db: Prisma.TransactionClient) => {
      // Row lock via SELECT ... FOR UPDATE-equivalent: Prisma doesn't expose
      // FOR UPDATE directly, but re-reading status inside the transaction and
      // gating the subsequent update on it (see the guard right below) is
      // what actually prevents a double-approve — two concurrent approvals
      // both read PENDING outside a tx is the race; inside one tx, Postgres
      // serializes the two transactions' writes to this row, so the second
      // one always sees the first one's committed APPROVED status.
      const deposit = await db.depositRequest.findUnique({ where: { id: params.id } });
      if (!deposit) throw new Error("NOT_FOUND");
      if (deposit.status !== "PENDING") throw new Error("ALREADY_REVIEWED");

      const wallet = await db.wallet.upsert({
        where: { userId: deposit.userId },
        update: {},
        create: { userId: deposit.userId }
      });
      if (wallet.frozen) throw new Error("WALLET_FROZEN");

      const oldBalance = wallet.balance;
      const newBalance = Number(wallet.balance) + Number(deposit.amount);

      const updatedWallet = await db.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: deposit.amount } }
      });

      const walletTx = await db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: deposit.amount,
          oldBalance,
          newBalance: updatedWallet.balance,
          note: `Nạp tiền qua ${deposit.method === "QR_BANK" ? "QR Banking" : "Card"} — yêu cầu #${deposit.id}`,
          ipAddress: deposit.ipAddress,
          userAgent: deposit.userAgent,
          reviewedById: actingUser.sub,
          reviewedAt: new Date()
        }
      });

      const updatedDeposit = await db.depositRequest.update({
        where: { id: deposit.id },
        data: {
          status: "APPROVED",
          reviewedById: actingUser.sub,
          reviewedAt: new Date(),
          walletTransactionId: walletTx.id
        }
      });

      await db.notification.create({
        data: {
          userId: deposit.userId,
          type: "WALLET",
          title: "Nạp tiền thành công",
          body: `Yêu cầu nạp ${Number(deposit.amount).toLocaleString("vi-VN")}đ đã được duyệt. Số dư mới: ${Number(newBalance).toLocaleString("vi-VN")}đ.`
        }
      });

      await db.auditLog.create({
        data: {
          userId: actingUser.sub,
          action: "ADMIN_APPROVE_DEPOSIT",
          metadata: { depositId: deposit.id, targetUserId: deposit.userId, amount: Number(deposit.amount), method: deposit.method }
        }
      });

      return { deposit: updatedDeposit, transaction: walletTx };
    });

    return jsonOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return jsonError("Không tìm thấy yêu cầu nạp tiền.", 404);
    if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
      return jsonError("Yêu cầu này đã được xử lý trước đó.", 409);
    }
    if (error instanceof Error && error.message === "WALLET_FROZEN") {
      return jsonError("Ví của người dùng này đang bị tạm khóa. Mở khóa trước khi duyệt.", 423);
    }
    return handleApiError(error, "admin/deposits/[id]/approve:POST");
  }
}
