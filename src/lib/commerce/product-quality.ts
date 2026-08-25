export interface ProductQualityInput {
  name?: string | null;
  price?: number | null;
  thumbnailUrl?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string | null;
  licenseType?: string | null;
  previewVideoUrl?: string | null;
  featureBullets?: string[] | null;
  slug?: string | null;
  tags?: string[] | null;
}

export interface ProductQualityResult {
  score: number;
  missing: { key: string; label: string }[];
}

const CHECKS: { key: keyof ProductQualityInput | "seo"; label: string; pass: (p: ProductQualityInput) => boolean }[] = [
  { key: "name", label: "Tiêu đề", pass: (p) => Boolean(p.name && p.name.trim().length >= 2) },
  { key: "price", label: "Giá", pass: (p) => typeof p.price === "number" && p.price >= 0 },
  { key: "thumbnailUrl", label: "Ảnh đại diện", pass: (p) => Boolean(p.thumbnailUrl) },
  { key: "description", label: "Mô tả", pass: (p) => Boolean((p.description ?? p.shortDescription)?.trim()) },
  { key: "categoryId", label: "Danh mục", pass: (p) => Boolean(p.categoryId) },
  { key: "licenseType", label: "Giấy phép", pass: (p) => Boolean(p.licenseType?.trim()) },
  { key: "previewVideoUrl", label: "Demo / preview", pass: (p) => Boolean(p.previewVideoUrl || (p.featureBullets && p.featureBullets.length > 0)) },
  { key: "seo", label: "SEO (slug + mô tả ngắn)", pass: (p) => Boolean(p.slug && p.shortDescription && p.shortDescription.length >= 4) }
];

export function computeProductQuality(product: ProductQualityInput): ProductQualityResult {
  const missing = CHECKS.filter((check) => !check.pass(product)).map((check) => ({ key: String(check.key), label: check.label }));
  const score = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100);
  return { score, missing };
}
