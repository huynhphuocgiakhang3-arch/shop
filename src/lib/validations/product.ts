import { z } from "zod";

export const productSchema = z.object({
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
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  categoryId: z.string().optional().or(z.literal(""))
});
export type ProductInput = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();

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
