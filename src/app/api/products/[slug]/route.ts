import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { isSchemaDriftError } from "@/lib/db/ensure-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const relations = {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" as const },
        take: 20,
        include: {
          user: { select: { displayName: true, avatarUrl: true } },
          _count: { select: { likes: true } }
        }
      },
      _count: { select: { reviews: true, favorites: true } }
    } as const;

    let product;
    try {
      product = await prisma.product.findUnique({
        where: { slug: params.slug },
        include: relations
      });
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      product = await prisma.product.findUnique({
        where: { slug: params.slug },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          thumbnailUrl: true,
          galleryUrls: true,
          featureBullets: true,
          previewVideoUrl: true,
          releaseNotes: true,
          tags: true,
          version: true,
          fileSizeMb: true,
          compatibility: true,
          price: true,
          discountPrice: true,
          stock: true,
          isVipOnly: true,
          isFeatured: true,
          status: true,
          downloadCount: true,
          salesCount: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          ...relations
        }
      });
    }

    if (!product || product.status !== "PUBLISHED") {
      return jsonError("Không tìm thấy sản phẩm.", 404);
    }

    const ratingAgg = await prisma.review.aggregate({
      where: { productId: product.id, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true }
    });
    const { resolveProductMetrics } = await import("@/lib/commerce/display-metrics");
    const metrics = resolveProductMetrics(product, {
      averageRating: Number(ratingAgg._avg.rating ?? 0),
      reviewCount: ratingAgg._count._all,
      buyerCount: product.salesCount
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
      product: {
        ...product,
        averageRating: metrics.rating,
        reviewCount: metrics.reviewCount,
        buyerCount: metrics.buyerCount,
        realAverageRating: Number(ratingAgg._avg.rating ?? 0),
        realReviewCount: ratingAgg._count._all,
        realBuyerCount: product.salesCount
      },
      related,
      isFavorited,
      hasPurchased
    });
  } catch (error) {
    return handleApiError(error, "products/[slug]:GET");
  }
}
