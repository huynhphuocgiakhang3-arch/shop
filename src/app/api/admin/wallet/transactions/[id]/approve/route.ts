import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const tx = await prisma.walletTransaction.findUnique({ where: { id: params.id } });
    if (!tx) return jsonError("Không tìm thấy giao dịch.", 404);
    if (tx.status !== "PENDING") return jsonError("Giao dịch này đã được xử lý.", 400);

    await prisma.$transaction(async (db: Prisma.TransactionClient) => {
      if (tx.type === "DEPOSIT") {
        await db.wallet.update({ where: { id: tx.walletId }, data: { balance: { increment: tx.amount } } });
      } else if (tx.type === "WITHDRAW") {
        // Funds were already moved out of `balance` into `pendingBalance`
        // when the withdrawal was requested — approving just clears the hold.
        await db.wallet.update({ where: { id: tx.walletId }, data: { pendingBalance: { decrement: tx.amount } } });
      }

      await db.walletTransaction.update({
        where: { id: tx.id },
        data: { status: "COMPLETED", reviewedById: user.sub, reviewedAt: new Date() }
      });

      const wallet = await db.wallet.findUnique({ where: { id: tx.walletId } });
      if (wallet) {
        await db.notification.create({
          data: {
            userId: wallet.userId,
            type: "WALLET",
            title: tx.type === "DEPOSIT" ? "Nạp tiền thành công" : "Rút tiền đã được duyệt",
            body: `Giao dịch ${tx.type === "DEPOSIT" ? "nạp" : "rút"} ${tx.amount.toString()}đ đã hoàn tất.`
          }
        });
      }
    });

    const updated = await prisma.walletTransaction.findUnique({ where: { id: params.id } });
    return jsonOk({ transaction: updated });
  } catch (error) {
    return handleApiError(error, "admin/wallet/transactions/[id]/approve:POST");
  }
}
