import { prisma } from "@/lib/prisma";

const TAX_RATE = Number(process.env.TAX_RATE ?? 0); // e.g. 0.08 for 8% VAT — configurable per deployment

// These interfaces mirror the Prisma model shapes returned by the
// `include: { items: { include: { product: true } }, coupon: true }` query.
// When `prisma generate` has run the actual Prisma types are structurally
// compatible; before generate they resolve to `any`, so we declare them
// explicitly here to keep TypeScript strict mode happy in all environments.
export interface CartProduct {
  id?: string;
  price: unknown;
  discountPrice: unknown;
  stock?: number | null;
  isVipOnly?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  savedForLater: boolean;
  product: CartProduct;
}

export interface CartCoupon {
  isActive: boolean;
  expiresAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  discountType: string;
  discountValue: unknown;
  products?: { id: string }[];
}

export interface CartWithItems {
  id: string;
  userId: string;
  couponId: string | null;
  items: CartItem[];
  coupon: CartCoupon | null;
}

export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } }, coupon: { include: { products: { select: { id: true } } } } }
  });
  if (existing) return existing as CartWithItems;

  return prisma.cart.create({
    data: { userId },
    include: { items: { include: { product: true } }, coupon: { include: { products: { select: { id: true } } } } }
  }) as Promise<CartWithItems>;
}

export function computeCartSummary(cart: CartWithItems) {
  const activeItems = cart.items.filter((item: CartItem) => !item.savedForLater);

  const subtotal = activeItems.reduce((sum: number, item: CartItem) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    return sum + Number(unitPrice) * item.quantity;
  }, 0);

  let discountTotal = 0;
  if (cart.coupon && cart.coupon.isActive) {
    const notExpired = !cart.coupon.expiresAt || cart.coupon.expiresAt > new Date();
    const underLimit = !cart.coupon.usageLimit || cart.coupon.usageCount < cart.coupon.usageLimit;
    const scopedIds = cart.coupon.products?.map((product) => product.id) ?? [];
    const eligibleSubtotal = scopedIds.length
      ? activeItems
          .filter((item: CartItem) => scopedIds.includes(item.productId) || (item.product.id != null && scopedIds.includes(item.product.id)))
          .reduce((sum: number, item: CartItem) => {
            const unitPrice = item.product.discountPrice ?? item.product.price;
            return sum + Number(unitPrice) * item.quantity;
          }, 0)
      : subtotal;
    if (notExpired && underLimit && eligibleSubtotal > 0) {
      discountTotal =
        cart.coupon.discountType === "PERCENT"
          ? eligibleSubtotal * (Number(cart.coupon.discountValue) / 100)
          : Math.min(eligibleSubtotal, Number(cart.coupon.discountValue));
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = taxableAmount * TAX_RATE;
  const total = taxableAmount + taxTotal;

  return {
    itemCount: activeItems.reduce((n: number, i: CartItem) => n + i.quantity, 0),
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxTotal: round2(taxTotal),
    total: round2(total)
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
