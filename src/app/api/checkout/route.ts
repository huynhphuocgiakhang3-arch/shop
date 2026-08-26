import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { checkoutSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary, type CartWithItems } from "@/lib/commerce/cart";
import { generateOrderNumber } from "@/lib/tokens";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";
import { getSiteSettings } from "@/lib/settings";
import { fulfillPaidOrderItems } from "@/lib/commerce/fulfill";
import { sendTransactionalEmail, orderUrl } from "@/lib/email";
import { vipGateMessage, stockGateMessage } from "@/lib/commerce/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  savedForLater: boolean;
  product: {
    id?: string;
    discountPrice: unknown;
    price: unknown;
    stock?: number | null;
    isVipOnly?: boolean;
    name?: string;
  };
}

interface OrderItemRow {
  id: string;
  productId: string;
  quantity: number;
  licenseKey?: string | null;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const { user, response } = await requireActiveUser();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return jsonError("Vui lòng chọn phương thức thanh toán hợp lệ.", 422);

  const cart: CartWithItems = await getOrCreateCart(user.sub);
  const activeItems = (cart.items as CartItemWithProduct[]).filter((item) => !item.savedForLater);
  if (activeItems.length === 0) return jsonError("Giỏ hàng đang trống.", 400);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { membershipTier: true, email: true, displayName: true }
  });

  for (const item of activeItems) {
    const vipBlock = vipGateMessage(Boolean(item.product.isVipOnly), dbUser?.membershipTier);
    if (vipBlock) return jsonError(`${item.product.name ?? "Sản phẩm"}: ${vipBlock}`, 403);
    const stockBlock = stockGateMessage(item.product.stock, item.quantity);
    if (stockBlock) return jsonError(`${item.product.name ?? "Sản phẩm"}: ${stockBlock}`, 409);
  }

  const summary = computeCartSummary(cart);
  const paymentMethod = parsed.data.paymentMethod;
  const paymentNote = parsed.data.paymentNote?.trim() || null;

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
          paymentMethod,
          paymentNote,
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

      if (paymentMethod === "BANK_TRANSFER") {
        await tx.notification.create({
          data: {
            userId: user.sub,
            type: "ORDER",
            title: "Đơn hàng đang chờ xác nhận chuyển khoản",
            body: `Đơn ${order.orderNumber} đã được tạo. Vault sẽ mở ngay khi Super Admin xác nhận đã nhận tiền.`
          }
        });
        if (cart.couponId) {
          await tx.coupon.update({ where: { id: cart.couponId }, data: { usageCount: { increment: 1 } } });
        }
        await tx.cartItem.deleteMany({ where: { cartId: cart.id, savedForLater: false } });
        await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
        return order;
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: user.sub } });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      if (wallet.frozen) throw new Error("WALLET_FROZEN");

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
      const paid = await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() }, include: { items: true } });
      await fulfillPaidOrderItems(tx, { userId: user.sub, items: paid.items as OrderItemRow[] });

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

      return paid;
    });

    if (result.status === "PAID") {
      await creditReferralCommissionIfEligible(user.sub, result);
    }

    if (dbUser?.email) {
      const paid = paymentMethod === "WALLET";
      await sendTransactionalEmail({
        to: dbUser.email,
        subject: paid ? `Đơn ${result.orderNumber} đã thanh toán` : `Đơn ${result.orderNumber} đang chờ chuyển khoản`,
        text: paid
          ? `Cảm ơn bạn đã mua trên KhangHuynh Vault. Đơn ${result.orderNumber} đã vào Vault.\n${orderUrl(result.id)}`
          : `Đơn ${result.orderNumber} đã được tạo. Chuyển khoản đúng số tiền rồi chờ Super Admin xác nhận.\n${orderUrl(result.id)}`
      });
    }

    return jsonOk({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return jsonError("Tài khoản chưa có Wallet. Vui lòng nạp tiền hoặc chọn chuyển khoản.", 400);
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return jsonError("Số dư ví không đủ. Hãy nạp thêm hoặc chọn chuyển khoản.", 402);
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

async function creditReferralCommissionIfEligible(buyerId: string, order: PaidOrder) {
  try {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { referredById: true, displayName: true } });
    if (!buyer?.referredById) return;

    const paidOrderCount = await prisma.order.count({ where: { userId: buyerId, status: "PAID" } });
    if (paidOrderCount !== 1) return;

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
