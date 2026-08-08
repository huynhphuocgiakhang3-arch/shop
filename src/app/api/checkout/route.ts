import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { checkoutSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary, type CartWithItems } from "@/lib/commerce/cart";
import { generateOrderNumber, generateSecureToken } from "@/lib/tokens";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  savedForLater: boolean;
  product: { discountPrice: unknown; price: unknown };
}

interface OrderItemRow {
  id: string;
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const { user, response } = await requireActiveUser();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return jsonError("Vui lòng chọn phương thức thanh toán.", 422);

  const cart: CartWithItems = await getOrCreateCart(user.sub);
  const activeItems = (cart.items as CartItemWithProduct[]).filter((item) => !item.savedForLater);
  if (activeItems.length === 0) return jsonError("Giỏ hàng đang trống.", 400);

  const summary = computeCartSummary(cart);

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.sub,
          subtotal: summary.subtotal,
          discountTotal: summary.discountTotal,
          taxTotal: summary.taxTotal,
          total: summary.total,
          couponId: cart.couponId,
          paymentMethod: parsed.data.paymentMethod,
          status: "PENDING",
          items: {
            create: activeItems.map((item: CartItemWithProduct) => ({
              productId: item.productId,
              unitPrice: item.product.discountPrice ?? item.product.price,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      });

      if (parsed.data.paymentMethod === "WALLET") {
        const wallet = await tx.wallet.findUnique({ where: { userId: user.sub } });
        if (!wallet || Number(wallet.balance) < summary.total) {
          throw new Error("INSUFFICIENT_BALANCE");
        }
        if (wallet.frozen) throw new Error("WALLET_FROZEN");

        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: summary.total } } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "PURCHASE",
            status: "COMPLETED",
            amount: summary.total,
            note: `Thanh toán đơn hàng ${order.orderNumber}`
          }
        });
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });

        for (const item of order.items as OrderItemRow[]) {
          await tx.downloadToken.create({
            data: {
              token: generateSecureToken(),
              userId: user.sub,
              productId: item.productId,
              orderItemId: item.id
            }
          });
          await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
        }

        await tx.notification.create({
          data: {
            userId: user.sub,
            type: "ORDER",
            title: "Thanh toán thành công",
            body: `Đơn hàng ${order.orderNumber} đã được thanh toán bằng ví. Bạn có thể tải xuống sản phẩm ngay.`
          }
        });
      } else {
        await tx.notification.create({
          data: {
            userId: user.sub,
            type: "ORDER",
            title: "Đơn hàng đang chờ xác nhận",
            body: `Đơn hàng ${order.orderNumber} đang chờ xác nhận thanh toán thủ công từ quản trị viên.`
          }
        });
      }

      if (cart.couponId) {
        await tx.coupon.update({ where: { id: cart.couponId }, data: { usageCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id, savedForLater: false } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });

      return order;
    });

    return jsonOk({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return jsonError("Số dư ví không đủ để thanh toán đơn hàng này.", 402);
    }
    if (error instanceof Error && error.message === "WALLET_FROZEN") {
      return jsonError("Ví của bạn đang bị tạm khóa. Vui lòng liên hệ Admin.", 423);
    }
    logApiError("checkout", error);
    return jsonError("Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại.", 500);
  }
}
