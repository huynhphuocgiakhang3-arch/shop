import { resolveProductMetrics, type ProductMetricSource } from "@/lib/commerce/display-metrics";

export interface RatingLookup {
  averageRating: number;
  reviewCount: number;
}

export function enrichStorefrontProduct<T extends ProductMetricSource & { id: string; salesCount?: number | null }>(
  product: T,
  rating?: RatingLookup
) {
  const metrics = resolveProductMetrics(product, {
    averageRating: rating?.averageRating ?? 0,
    reviewCount: rating?.reviewCount ?? 0,
    buyerCount: product.salesCount ?? 0
  });

  return {
    ...product,
    averageRating: metrics.rating,
    reviewCount: metrics.reviewCount,
    buyerCount: metrics.buyerCount,
    realAverageRating: rating?.averageRating ?? 0,
    realReviewCount: rating?.reviewCount ?? 0,
    realBuyerCount: product.salesCount ?? 0
  };
}

export function isNewProduct(createdAt: Date | string | undefined) {
  if (!createdAt) return false;
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Date.now() - created.getTime() < 30 * 24 * 60 * 60 * 1000;
}
