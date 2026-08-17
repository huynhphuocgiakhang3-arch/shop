import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { addToCartSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary } from "@/lib/commerce/cart";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) return jsonError("Thông tin không hợp lệ.", 422);

    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product || product.status !== "PUBLISHED") return jsonError("Không tìm thấy sản phẩm.", 404);

    const cart = await getOrCreateCart(user.sub);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity: parsed.data.quantity },
      update: { quantity: { increment: parsed.data.quantity }, savedForLater: false }
    });

    const updated = await getOrCreateCart(user.sub);
    return jsonOk({ cart: updated, summary: computeCartSummary(updated) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "cart/items:POST");
  }
}
