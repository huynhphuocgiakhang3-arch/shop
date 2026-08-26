import { NextRequest } from "next/server";
import { MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { applyCouponSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary } from "@/lib/commerce/cart";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keyed by the Prisma `MembershipTier` enum rather than `string`, so this
// is a finite mapped object (all four keys required) instead of an index
// signature — TypeScript can prove every lookup is defined instead of
// widening it to `number | undefined`. As a bonus, if `MembershipTier`
// ever gains a new value in schema.prisma, this object literal fails to
// compile until it's added here too — the alternative (a plain string key)
// would silently start returning `undefined` at runtime instead.
const TIER_RANK: Record<MembershipTier, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  DIAMOND: 3
};

function tierRank(tier: MembershipTier): number {
  return TIER_RANK[tier];
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = applyCouponSchema.safeParse(body);
    if (!parsed.success) return jsonError("Vui lòng nhập mã giảm giá.", 422);

    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return jsonError("Mã giảm giá không hợp lệ.", 404);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return jsonError("Mã giảm giá đã hết hạn.", 400);
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return jsonError("Mã giảm giá đã hết lượt sử dụng.", 400);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { membershipTier: true } });
    const userTier: MembershipTier = (dbUser?.membershipTier as MembershipTier | undefined) ?? "FREE";

    if (tierRank(userTier) < tierRank(coupon.minTier as MembershipTier)) {
      return jsonError("Hạng thành viên của bạn chưa đủ điều kiện dùng mã này.", 403);
    }

    const couponWithProducts = await prisma.coupon.findUnique({
      where: { id: coupon.id },
      include: { products: { select: { id: true } } }
    });
    const cart = await getOrCreateCart(user.sub);
    const scopedIds = couponWithProducts?.products.map((product: { id: string }) => product.id) ?? [];
    if (scopedIds.length > 0) {
      const matches = cart.items.some((item) => !item.savedForLater && scopedIds.includes(item.productId));
      if (!matches) return jsonError("Mã này chỉ áp dụng cho sản phẩm được chỉ định. Thêm sản phẩm đủ điều kiện vào giỏ trước.", 400);
    }
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });

    const updated = await getOrCreateCart(user.sub);
    return jsonOk({ cart: updated, summary: computeCartSummary(updated) });
  } catch (error) {
    return handleApiError(error, "cart/coupon:POST");
  }
}

export async function DELETE() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const cart = await getOrCreateCart(user.sub);
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });

    const updated = await getOrCreateCart(user.sub);
    return jsonOk({ cart: updated, summary: computeCartSummary(updated) });
  } catch (error) {
    return handleApiError(error, "cart/coupon:DELETE");
  }
}
