export type DisplayMetricMode = "AUTOMATIC" | "MANAGED";

export interface ProductMetricSource {
  displayRatingMode?: DisplayMetricMode | null;
  displayRating?: number | string | null;
  displayReviewCountMode?: DisplayMetricMode | null;
  displayReviewCount?: number | null;
  displayBuyerCountMode?: DisplayMetricMode | null;
  displayBuyerCount?: number | null;
  salesCount?: number | null;
}

export interface RealProductMetrics {
  averageRating: number;
  reviewCount: number;
  buyerCount: number;
}

export interface ResolvedProductMetrics {
  rating: number;
  reviewCount: number;
  buyerCount: number;
  ratingSource: DisplayMetricMode;
  reviewCountSource: DisplayMetricMode;
  buyerCountSource: DisplayMetricMode;
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, value));
}

function clampCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isManaged(mode: DisplayMetricMode | null | undefined) {
  return mode === "MANAGED";
}

export function resolveProductMetrics(
  source: ProductMetricSource,
  real: RealProductMetrics
): ResolvedProductMetrics {
  const ratingManaged = isManaged(source.displayRatingMode) && source.displayRating != null;
  const reviewManaged = isManaged(source.displayReviewCountMode) && source.displayReviewCount != null;
  const buyerManaged = isManaged(source.displayBuyerCountMode) && source.displayBuyerCount != null;

  const rating = ratingManaged ? clampRating(Number(source.displayRating)) : clampRating(real.averageRating);
  let reviewCount = reviewManaged ? clampCount(Number(source.displayReviewCount)) : clampCount(real.reviewCount);
  const buyerCount = buyerManaged ? clampCount(Number(source.displayBuyerCount)) : clampCount(real.buyerCount ?? source.salesCount ?? 0);

  if (reviewManaged && ratingManaged && rating >= 5 && reviewCount < 1) {
    reviewCount = clampCount(real.reviewCount);
  }

  return {
    rating,
    reviewCount,
    buyerCount,
    ratingSource: ratingManaged ? "MANAGED" : "AUTOMATIC",
    reviewCountSource: reviewManaged ? "MANAGED" : "AUTOMATIC",
    buyerCountSource: buyerManaged ? "MANAGED" : "AUTOMATIC"
  };
}

export function validateManagedMetrics(input: {
  displayRatingMode?: DisplayMetricMode;
  displayRating?: number | null;
  displayReviewCountMode?: DisplayMetricMode;
  displayReviewCount?: number | null;
  displayBuyerCountMode?: DisplayMetricMode;
  displayBuyerCount?: number | null;
}) {
  if (input.displayRating != null && (input.displayRating < 0 || input.displayRating > 5 || Number.isNaN(input.displayRating))) {
    return "Điểm đánh giá hiển thị phải từ 0 đến 5.";
  }
  if (input.displayReviewCount != null && (input.displayReviewCount < 0 || !Number.isInteger(input.displayReviewCount))) {
    return "Số đánh giá hiển thị phải là số nguyên ≥ 0.";
  }
  if (input.displayBuyerCount != null && (input.displayBuyerCount < 0 || !Number.isInteger(input.displayBuyerCount))) {
    return "Số người mua hiển thị phải là số nguyên ≥ 0.";
  }
  if (
    input.displayRatingMode === "MANAGED" &&
    input.displayReviewCountMode === "MANAGED" &&
    input.displayRating != null &&
    input.displayReviewCount != null &&
    input.displayRating > 0 &&
    input.displayReviewCount === 0
  ) {
    return "Không thể hiển thị điểm đánh giá khi số đánh giá bằng 0.";
  }
  return null;
}
