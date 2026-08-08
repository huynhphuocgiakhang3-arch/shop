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
      if (tx.type === "WITHDRAW") {
        // Return the held funds back to the spendable balance.
        await db.wallet.update({
          where: { id: tx.walletId },
          data: { pendingBalance: { decrement: tx.amount }, balance: { increment: tx.amount } }
        });
      }

      await db.walletTransaction.update({
        where: { id: tx.id },
        data: { status: "REJECTED", reviewedById: user.sub, reviewedAt: new Date() }
      });

      const wallet = await db.wallet.findUnique({ where: { id: tx.walletId } });
      if (wallet) {
        await db.notification.create({
          data: {
            userId: wallet.userId,
            type: "WALLET",
            title: "Giao dịch bị từ chối",
            body: `Giao dịch ${tx.type === "DEPOSIT" ? "nạp" : "rút"} ${tx.amount.toString()}đ đã bị từ chối.`
          }
        });
      }
    });

    const updated = await prisma.walletTransaction.findUnique({ where: { id: params.id } });
    return jsonOk({ transaction: updated });
  } catch (error) {
    return handleApiError(error, "admin/wallet/transactions/[id]/reject:POST");
  }
}
