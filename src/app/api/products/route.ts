import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// `satisfies` (not a `: Record<string, ...>` annotation) keeps the
// inferred type as a literal object with these six exact keys, rather than
// widening it to an index signature. `sort` comes from a query string, so
// it's arbitrary user input — SORT_OPTIONS[sort] would still be
// `T | undefined` if indexed directly (correctly so, since an attacker can
// send `?sort=drop-table`). The type guard below narrows it to the exact
// key union first, so the actual lookup is provably defined instead of
// being silently rescued by a `?? SORT_OPTIONS.newest` fallback that was
// itself flagged as possibly undefined under noUncheckedIndexedAccess.
const SORT_OPTIONS = {
  newest: { createdAt: "desc" as const },
  oldest: { createdAt: "asc" as const },
  "price-asc": { price: "asc" as const },
  "price-desc": { price: "desc" as const },
  popular: { salesCount: "desc" as const },
  downloads: { downloadCount: "desc" as const }
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
    const tag = sp.get("tag")?.trim();
    const featured = sp.get("featured");
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
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
      ...(tag && { tags: { has: tag } }),
      ...(featured === "true" && { isFeatured: true }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) })
        }
      })
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = SORT_OPTIONS[sortKey];

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
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
          salesCount: true,
          downloadCount: true,
          tags: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          _count: { select: { reviews: true } }
        }
      }),
      prisma.product.count({ where })
    ]);

    type ProductListItem = typeof items[number];
    type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
    const ratings = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: items.map((item: ProductListItem) => item.id) }, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true }
    }) as RatingRow[];
    const ratingMap = new Map<string, { averageRating: number; reviewCount: number }>(
      ratings.map((r: RatingRow) => [r.productId, { averageRating: Number(r._avg.rating ?? 0), reviewCount: r._count._all }])
    );
    const enriched = items.map((item: ProductListItem) => ({ ...item, ...(ratingMap.get(item.id) ?? { averageRating: 0, reviewCount: 0 }) }));
    return jsonOk(paginatedResponse(enriched, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "products:GET");
  }
}
