import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { generateSecureToken } from "@/lib/tokens";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const status = body?.status as "PAID" | "CANCELLED" | undefined;
    if (!status || !["PAID", "CANCELLED"].includes(status)) {
      return jsonError("Trạng thái không hợp lệ.", 422);
    }

    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!order) return jsonError("Không tìm thấy đơn hàng.", 404);
    if (order.status !== "PENDING") return jsonError("Chỉ có thể cập nhật đơn hàng đang chờ xử lý.", 400);

    if (status === "PAID") {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
        for (const item of order.items) {
          await tx.downloadToken.create({
            data: { token: generateSecureToken(), userId: order.userId, productId: item.productId, orderItemId: item.id }
          });
          await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
        }
        await tx.notification.create({
          data: {
            userId: order.userId,
            type: "ORDER",
            title: "Đơn hàng đã được xác nhận",
            body: `Đơn hàng ${order.orderNumber} đã thanh toán thành công. Bạn có thể tải xuống sản phẩm.`
          }
        });
      });
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER",
          title: "Đơn hàng đã bị hủy",
          body: `Đơn hàng ${order.orderNumber} đã bị hủy.`
        }
      });
    }

    const updated = await prisma.order.findUnique({ where: { id: params.id } });
    return jsonOk({ order: updated });
  } catch (error) {
    return handleApiError(error, "admin/orders/[id]:PATCH");
  }
}
