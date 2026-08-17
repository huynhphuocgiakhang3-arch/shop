import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const tx = await prisma.walletTransaction.findUnique({ where: { id: params.id } });
    if (!tx) return jsonError("Không tìm thấy giao dịch.", 404);

    await prisma.$transaction(async (db: Prisma.TransactionClient) => {
      // Reverse whatever balance effect this transaction had before removing
      // the record, so deleting a row can never silently leave the wallet
      // out of sync with its transaction history.
      if (tx.status === "COMPLETED") {
        if (tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "BONUS" || tx.type === "ADJUSTMENT") {
          await db.wallet.update({ where: { id: tx.walletId }, data: { balance: { decrement: tx.amount } } });
        } else if (tx.type === "WITHDRAW" || tx.type === "PURCHASE" || tx.type === "COMMISSION") {
          await db.wallet.update({ where: { id: tx.walletId }, data: { balance: { increment: tx.amount } } });
        }
      } else if (tx.status === "PENDING" && tx.type === "WITHDRAW") {
        await db.wallet.update({
          where: { id: tx.walletId },
          data: { pendingBalance: { decrement: tx.amount }, balance: { increment: tx.amount } }
        });
      }

      await db.walletTransaction.delete({ where: { id: tx.id } });
    });

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_DELETE_WALLET_TX", metadata: { transactionId: params.id } }
    });

    return jsonOk({ message: "Đã xóa giao dịch." });
  } catch (error) {
    return handleApiError(error, "admin/wallet/transactions/[id]:DELETE");
  }
}
