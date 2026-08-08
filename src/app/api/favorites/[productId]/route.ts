import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { productId: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const product = await prisma.product.findUnique({ where: { id: params.productId } });
    if (!product) return jsonError("Không tìm thấy sản phẩm.", 404);

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: user.sub, productId: params.productId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return jsonOk({ isFavorited: false });
    }

    await prisma.favorite.create({ data: { userId: user.sub, productId: params.productId } });
    return jsonOk({ isFavorited: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "favorites/[productId]:POST");
  }
}
