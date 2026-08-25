import { z } from "zod";

const productFields = z.object({
  name: z.string().min(2, "Tên sản phẩm quá ngắn."),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang."),
  shortDescription: z.string().min(4),
  description: z.string().min(4),
  thumbnailUrl: z.string().url("Ảnh đại diện không hợp lệ."),
  galleryUrls: z.array(z.string().url()).default([]),
  featureBullets: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  previewVideoUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().url().optional().or(z.literal("")),
  releaseNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().default("1.0.0"),
  fileSizeMb: z.number().int().positive().optional(),
  compatibility: z.string().optional(),
  price: z.number().nonnegative(),
  discountPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  salesCount: z.number().int().nonnegative().optional(),
  isVipOnly: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isEditorsPick: z.boolean().default(false),
  isLimited: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  licenseType: z.string().max(80).optional().or(z.literal("")),
  licenseTerms: z.string().max(4000).optional().or(z.literal("")),
  displayRatingMode: z.enum(["AUTOMATIC", "MANAGED"]).default("AUTOMATIC"),
  displayRating: z.number().min(0).max(5).optional().nullable(),
  displayReviewCountMode: z.enum(["AUTOMATIC", "MANAGED"]).default("AUTOMATIC"),
  displayReviewCount: z.number().int().nonnegative().optional().nullable(),
  displayBuyerCountMode: z.enum(["AUTOMATIC", "MANAGED"]).default("AUTOMATIC"),
  displayBuyerCount: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  categoryId: z.string().optional().or(z.literal(""))
});

export const productSchema = productFields.superRefine((value, ctx) => {
  if (value.discountPrice != null && value.price != null && value.discountPrice > value.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Giá khuyến mãi không được cao hơn giá gốc.", path: ["discountPrice"] });
  }
  if (value.displayRatingMode === "MANAGED" && value.displayRating != null && value.displayReviewCountMode === "MANAGED" && value.displayReviewCount === 0 && value.displayRating > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Không thể hiển thị điểm khi số đánh giá bằng 0.", path: ["displayReviewCount"] });
  }
});
export type ProductInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productFields.partial();

export const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục quá ngắn."),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug không hợp lệ."),
  icon: z.string().optional(),
  color: z.string().optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().int().default(0),
  parentId: z.string().optional().nullable()
});
export type CategoryInput = z.infer<typeof categorySchema>;
