import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          where: { isHidden: false },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { displayName: true, avatarUrl: true } },
            _count: { select: { likes: true } }
          }
        },
        _count: { select: { reviews: true, favorites: true } }
      }
    });

    if (!product || product.status !== "PUBLISHED") {
      return jsonError("Không tìm thấy sản phẩm.", 404);
    }

    const ratingAgg = await prisma.review.aggregate({
      where: { productId: product.id, isHidden: false },
      _avg: { rating: true }
    });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, status: "PUBLISHED", NOT: { id: product.id } },
      take: 4,
      select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, discountPrice: true }
    });

    const user = await getSessionUser();
    let isFavorited = false;
    let hasPurchased = false;

    if (user) {
      const [favorite, purchase] = await Promise.all([
        prisma.favorite.findUnique({ where: { userId_productId: { userId: user.sub, productId: product.id } } }),
        prisma.orderItem.findFirst({
          where: { productId: product.id, order: { userId: user.sub, status: "PAID" } }
        })
      ]);
      isFavorited = Boolean(favorite);
      hasPurchased = Boolean(purchase);
    }

    return jsonOk({
      product: { ...product, averageRating: ratingAgg._avg.rating ?? 0 },
      related,
      isFavorited,
      hasPurchased
    });
  } catch (error) {
    return handleApiError(error, "products/[slug]:GET");
  }
}
