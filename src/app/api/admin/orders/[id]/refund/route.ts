import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return jsonError("Không tìm thấy đơn hàng.", 404);
    if (order.status !== "PAID") return jsonError("Chỉ có thể hoàn tiền đơn hàng đã thanh toán.", 400);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: order.userId },
        update: {},
        create: { userId: order.userId }
      });

      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: order.total } } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          status: "COMPLETED",
          amount: order.total,
          note: `Hoàn tiền đơn hàng ${order.orderNumber}`
        }
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED", refundedAt: new Date() } });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "WALLET",
          title: "Đơn hàng đã được hoàn tiền",
          body: `Đơn hàng ${order.orderNumber} đã được hoàn ${order.total.toString()}đ vào ví của bạn.`
        }
      });
    });

    const updated = await prisma.order.findUnique({ where: { id: params.id } });
    return jsonOk({ order: updated });
  } catch (error) {
    return handleApiError(error, "admin/orders/[id]/refund:POST");
  }
}
