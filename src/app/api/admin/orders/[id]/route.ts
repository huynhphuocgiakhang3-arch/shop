import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { fulfillPaidOrderItems } from "@/lib/commerce/fulfill";
import { sendTransactionalEmail, orderUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const requestedStatus = body?.status as "PAID" | "CANCELLED" | "REFUNDED" | "PENDING" | undefined;
    const hasNote = Object.prototype.hasOwnProperty.call(body ?? {}, "adminNote");
    const adminNote = hasNote ? (body?.adminNote == null ? null : String(body.adminNote).slice(0, 2000)) : undefined;

    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!order) return jsonError("Không tìm thấy đơn hàng.", 404);

    // Completed orders can be edited by Super Admin/Admin for operational corrections.
    // Status changes on completed/refunded orders do not create duplicate download tokens.
    if (hasNote && !requestedStatus) {
      const updated = await prisma.order.update({ where: { id: order.id }, data: { adminNote } });
      return jsonOk({ order: updated });
    }
    const status = requestedStatus;
    if (!status || !["PAID", "CANCELLED", "REFUNDED", "PENDING"].includes(status)) {
      return jsonError("Trạng thái không hợp lệ.", 422);
    }

    if (order.status !== "PENDING") {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status, ...(hasNote ? { adminNote } : {}) }
      });
      return jsonOk({ order: updated });
    }

    if (status === "PAID") {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), ...(hasNote ? { adminNote } : {}) } });
        await fulfillPaidOrderItems(tx, { userId: order.userId, items: order.items });
        await tx.notification.create({
          data: {
            userId: order.userId,
            type: "ORDER",
            title: "Đơn hàng đã được xác nhận",
            body: `Đơn hàng ${order.orderNumber} đã thanh toán thành công. Sản phẩm đã vào Vault.`
          }
        });
      });
      const buyer = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
      if (buyer?.email) {
        await sendTransactionalEmail({
          to: buyer.email,
          subject: `Đơn ${order.orderNumber} đã được xác nhận`,
          text: `Chuyển khoản của bạn đã được xác nhận. Vault đã mở.\n${orderUrl(order.id)}`
        });
      }
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", ...(hasNote ? { adminNote } : {}) } });
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
