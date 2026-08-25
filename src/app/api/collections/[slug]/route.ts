import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { slug: params.slug },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                shortDescription: true,
                thumbnailUrl: true,
                price: true,
                discountPrice: true,
                isFeatured: true,
                isVipOnly: true,
                isBestseller: true,
                salesCount: true,
                status: true,
                displayRatingMode: true,
                displayRating: true,
                displayReviewCountMode: true,
                displayReviewCount: true,
                displayBuyerCountMode: true,
                displayBuyerCount: true,
                category: { select: { name: true, slug: true } }
              }
            }
          }
        }
      }
    });

    if (!collection) return jsonError("Không tìm thấy bộ sưu tập.", 404);

    type CollectionProductRow = (typeof collection.products)[number];
    type PublishedProduct = CollectionProductRow["product"];
    const published = collection.products
      .filter((row: CollectionProductRow) => row.product.status === "PUBLISHED")
      .map((row: CollectionProductRow) => row.product);
    type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
    const ratings = (await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: published.map((product: PublishedProduct) => product.id) }, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true }
    })) as RatingRow[];
    const ratingMap = new Map(ratings.map((row: RatingRow) => [row.productId, { averageRating: Number(row._avg.rating ?? 0), reviewCount: row._count._all }]));

    return jsonOk({
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        coverUrl: collection.coverUrl,
        products: published.map((product: PublishedProduct) => ({
          ...product,
          price: Number(product.price),
          discountPrice: product.discountPrice == null ? null : Number(product.discountPrice),
          averageRating: ratingMap.get(product.id)?.averageRating ?? 0,
          reviewCount: ratingMap.get(product.id)?.reviewCount ?? 0
        }))
      }
    });
  } catch (error) {
    return handleApiError(error, "collections/[slug]:GET");
  }
}
