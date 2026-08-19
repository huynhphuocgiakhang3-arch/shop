import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { checkoutSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary, type CartWithItems } from "@/lib/commerce/cart";
import { generateOrderNumber, generateSecureToken } from "@/lib/tokens";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";
import { getSiteSettings } from "@/lib/settings";

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
  if (!parsed.success) return jsonError("Thanh toán chỉ sử dụng số dư Wallet. Vui lòng nạp tiền trước khi mua.", 422);

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
          paymentMethod: "WALLET",
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

      const wallet = await tx.wallet.findUnique({ where: { userId: user.sub } });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      if (wallet.frozen) throw new Error("WALLET_FROZEN");

      // Atomic debit: the database only applies the debit when the wallet has
      // enough balance and is not frozen. This prevents double-spend races.
      const oldBalance = wallet.balance;
      const newBalance = oldBalance.sub(summary.total);
      const debited = await tx.wallet.updateMany({
        where: { id: wallet.id, frozen: false, balance: { gte: summary.total } },
        data: { balance: { decrement: summary.total } }
      });
      if (debited.count !== 1) throw new Error("INSUFFICIENT_BALANCE");

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "PURCHASE",
          status: "COMPLETED",
          amount: summary.total,
          oldBalance,
          newBalance,
          note: `Thanh toán đơn hàng ${order.orderNumber}`
        }
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });

      for (const item of order.items as OrderItemRow[]) {
        await tx.downloadToken.create({ data: { token: generateSecureToken(), userId: user.sub, productId: item.productId, orderItemId: item.id } });
        await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
      }

      await tx.notification.create({
        data: {
          userId: user.sub,
          type: "ORDER",
          title: "Thanh toán bằng Wallet thành công",
          body: `Đơn hàng ${order.orderNumber} đã được thanh toán từ số dư Wallet. Sản phẩm đã được thêm vào Vault.`
        }
      });

      if (cart.couponId) {
        await tx.coupon.update({ where: { id: cart.couponId }, data: { usageCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id, savedForLater: false } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });

      return order;
    });

    // Referral commission — deliberately OUTSIDE the checkout transaction and
    // wrapped so any failure here is logged but never rolls back or fails
    // the purchase the buyer is waiting on. Runs once, on a referred user's
    // very first PAID order.
    await creditReferralCommissionIfEligible(user.sub, result);

    return jsonOk({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return jsonError("Tài khoản chưa có Wallet. Vui lòng nạp tiền trước khi mua.", 400);
    }
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

interface PaidOrder {
  id: string;
  orderNumber: string;
  total: Decimal;
}

/**
 * Credits the referrer's wallet a % of a referred user's FIRST paid order.
 * Intentionally best-effort: any failure is logged, never thrown, so a bug
 * or edge case in the referral program can never block or reverse a real
 * purchase. Idempotent by construction — only fires when the order count
 * for this buyer is exactly 1 (i.e. this order), so re-running it (it never
 * is, but hypothetically) on the same buyer after a second purchase is a
 * no-op.
 */
async function creditReferralCommissionIfEligible(buyerId: string, order: PaidOrder) {
  try {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { referredById: true, displayName: true } });
    if (!buyer?.referredById) return;

    const paidOrderCount = await prisma.order.count({ where: { userId: buyerId, status: "PAID" } });
    if (paidOrderCount !== 1) return; // Not their first purchase — commission already paid (or never eligible).

    const settings = await getSiteSettings();
    if (!settings.referralEnabled) return;

    const percent = Number(settings.referralCommissionPercent);
    if (!Number.isFinite(percent) || percent <= 0) return;

    const commissionAmount = order.total.mul(percent).div(100);
    if (commissionAmount.lte(0)) return;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const referrerWallet = await tx.wallet.findUnique({ where: { userId: buyer.referredById! } });
      if (!referrerWallet || referrerWallet.frozen) return;

      const oldBalance = referrerWallet.balance;
      const newBalance = oldBalance.add(commissionAmount);

      await tx.wallet.update({ where: { id: referrerWallet.id }, data: { balance: { increment: commissionAmount } } });
      await tx.walletTransaction.create({
        data: {
          walletId: referrerWallet.id,
          type: "COMMISSION",
          status: "COMPLETED",
          amount: commissionAmount,
          oldBalance,
          newBalance,
          note: `Hoa hồng giới thiệu ${percent}% từ đơn hàng đầu tiên của ${buyer.displayName} (${order.orderNumber})`
        }
      });
      await tx.notification.create({
        data: {
          userId: buyer.referredById!,
          type: "WALLET",
          title: "Bạn nhận được hoa hồng giới thiệu!",
          body: `${buyer.displayName} vừa hoàn tất đơn hàng đầu tiên. Bạn được cộng ${commissionAmount.toFixed(0)}đ hoa hồng vào Wallet.`
        }
      });
    });
  } catch (error) {
    logApiError("checkout:referral-commission", error);
  }
}
