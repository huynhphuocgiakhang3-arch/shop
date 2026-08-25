import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";
import { enrichStorefrontProduct } from "@/lib/commerce/enrich-products";
import { isSchemaDriftError } from "@/lib/db/ensure-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORT_OPTIONS = {
  newest: { createdAt: "desc" as const },
  oldest: { createdAt: "asc" as const },
  "price-asc": { price: "asc" as const },
  "price-desc": { price: "desc" as const },
  popular: { salesCount: "desc" as const },
  downloads: { downloadCount: "desc" as const },
  rating: { salesCount: "desc" as const }
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_OPTIONS, value);
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { page, pageSize, skip, take } = parsePagination(sp);

    const q = sp.get("q")?.trim();
    const categorySlug = sp.get("category")?.trim();
    const collectionSlug = sp.get("collection")?.trim();
    const tag = sp.get("tag")?.trim();
    const featured = sp.get("featured");
    const bestseller = sp.get("bestseller");
    const isNew = sp.get("new");
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
    const minRating = Number(sp.get("minRating") ?? "");
    const rawSort = sp.get("sort") ?? "newest";
    const sortKey: SortKey = isSortKey(rawSort) ? rawSort : "newest";

    const where: Prisma.ProductWhereInput = {
      status: "PUBLISHED",
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { tags: { has: q } }
        ]
      }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(collectionSlug && { collections: { some: { collection: { slug: collectionSlug } } } }),
      ...(tag && { tags: { has: tag } }),
      ...(featured === "true" && { isFeatured: true }),
      ...(bestseller === "true" && { isBestseller: true }),
      ...(isNew === "true" && { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) })
        }
      })
    };

    if (Number.isFinite(minRating) && minRating > 0) {
      const rated = await prisma.review.groupBy({
        by: ["productId"],
        where: { isHidden: false },
        _avg: { rating: true },
        having: { rating: { _avg: { gte: minRating } } }
      });
      where.id = { in: rated.map((row: { productId: string }) => row.productId) };
    }

    const productSelect = {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      thumbnailUrl: true,
      price: true,
      discountPrice: true,
      featureBullets: true,
      isVipOnly: true,
      isFeatured: true,
      isBestseller: true,
      isEditorsPick: true,
      isLimited: true,
      isPopular: true,
      licenseType: true,
      version: true,
      compatibility: true,
      fileSizeMb: true,
      salesCount: true,
      downloadCount: true,
      tags: true,
      createdAt: true,
      displayRatingMode: true,
      displayRating: true,
      displayReviewCountMode: true,
      displayReviewCount: true,
      displayBuyerCountMode: true,
      displayBuyerCount: true,
      category: { select: { name: true, slug: true } },
      _count: { select: { reviews: true } }
    } as const;

    const legacySelect = {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      thumbnailUrl: true,
      price: true,
      discountPrice: true,
      featureBullets: true,
      isVipOnly: true,
      isFeatured: true,
      version: true,
      compatibility: true,
      fileSizeMb: true,
      salesCount: true,
      downloadCount: true,
      tags: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      _count: { select: { reviews: true } }
    } as const;

    const legacyWhere: Prisma.ProductWhereInput = {
      ...where,
      collections: undefined,
      isBestseller: undefined
    };

    let items;
    let total: number;
    try {
      [items, total] = await Promise.all([
        prisma.product.findMany({ where, orderBy: SORT_OPTIONS[sortKey], skip, take, select: productSelect }),
        prisma.product.count({ where })
      ]);
    } catch (error) {
      if (!isSchemaDriftError(error)) throw error;
      [items, total] = await Promise.all([
        prisma.product.findMany({ where: legacyWhere, orderBy: SORT_OPTIONS[sortKey], skip, take, select: legacySelect }),
        prisma.product.count({ where: legacyWhere })
      ]);
    }

    type ProductListItem = (typeof items)[number];
    type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
    const ratings = (await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: items.map((item: ProductListItem) => item.id) }, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true }
    })) as RatingRow[];
    const ratingMap = new Map<string, { averageRating: number; reviewCount: number }>(
      ratings.map((r: RatingRow) => [r.productId, { averageRating: Number(r._avg.rating ?? 0), reviewCount: r._count._all }])
    );

    let enriched = items.map((item: ProductListItem) =>
      enrichStorefrontProduct(item, ratingMap.get(item.id) ?? { averageRating: 0, reviewCount: 0 })
    );

    if (sortKey === "rating") {
      enriched = [...enriched].sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);
    }

    return jsonOk(paginatedResponse(enriched, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "products:GET");
  }
}
