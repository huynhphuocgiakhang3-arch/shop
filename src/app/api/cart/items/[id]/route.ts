import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { updateCartItemSchema } from "@/lib/validations/commerce";
import { getOrCreateCart, computeCartSummary } from "@/lib/commerce/cart";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertOwnedItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) return null;
  return item;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) return jsonError("Số lượng không hợp lệ.", 422);

    const item = await assertOwnedItem(user.sub, params.id);
    if (!item) return jsonError("Không tìm thấy sản phẩm trong giỏ hàng.", 404);

    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: params.id } });
    } else {
      await prisma.cartItem.update({ where: { id: params.id }, data: { quantity: parsed.data.quantity } });
    }

    const updated = await getOrCreateCart(user.sub);
    return jsonOk({ cart: updated, summary: computeCartSummary(updated) });
  } catch (error) {
    return handleApiError(error, "cart/items/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const item = await assertOwnedItem(user.sub, params.id);
    if (!item) return jsonError("Không tìm thấy sản phẩm trong giỏ hàng.", 404);

    await prisma.cartItem.delete({ where: { id: params.id } });

    const updated = await getOrCreateCart(user.sub);
    return jsonOk({ cart: updated, summary: computeCartSummary(updated) });
  } catch (error) {
    return handleApiError(error, "cart/items/[id]:DELETE");
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Toggle "save for later" — kept as PUT to avoid overloading PATCH's
  // quantity contract.
  const { user, response } = await requireUser();
  if (response) return response;

  const item = await assertOwnedItem(user.sub, params.id);
  if (!item) return jsonError("Không tìm thấy sản phẩm trong giỏ hàng.", 404);

  const updated = await prisma.cartItem.update({
    where: { id: params.id },
    data: { savedForLater: !item.savedForLater }
  });

  return jsonOk({ item: updated });
}
