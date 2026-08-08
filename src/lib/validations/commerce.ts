import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(20).default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20)
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã giảm giá.")
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["WALLET", "BANK_TRANSFER", "STRIPE", "PAYPAL", "VNPAY", "MOMO", "MANUAL"])
});

export const walletDepositSchema = z
  .object({
    method: z.enum(["QR_BANK", "CARD"]),
    amount: z.number().positive("Số tiền nạp phải lớn hơn 0.").max(500_000_000, "Số tiền nạp vượt giới hạn cho phép."),
    proofImageUrl: z.string().url().optional(),
    cardCode: z.string().min(4).max(200).optional(),
    note: z.string().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (data.method === "QR_BANK" && !data.proofImageUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng tải lên ảnh chụp màn hình chuyển khoản.", path: ["proofImageUrl"] });
    }
    if (data.method === "CARD" && !data.cardCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập mã thẻ cào.", path: ["cardCode"] });
    }
  });

export const walletWithdrawSchema = z.object({
  amount: z.number().positive("Số tiền rút phải lớn hơn 0."),
  note: z.string().max(500).optional()
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
});

export const reportReviewSchema = z.object({
  reason: z.string().min(2, "Vui lòng nêu lý do báo cáo.")
});

export const supportTicketSchema = z.object({
  subject: z.string().min(3, "Vui lòng nhập tiêu đề."),
  body: z.string().min(3, "Vui lòng nhập nội dung."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM")
});

export const supportMessageSchema = z.object({
  body: z.string().min(1, "Vui lòng nhập nội dung."),
  attachmentUrl: z.string().url().optional()
});

export const couponSchema = z.object({
  code: z.string().min(2),
  description: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  usageLimit: z.number().int().positive().optional(),
  minTier: z.enum(["FREE", "SILVER", "GOLD", "DIAMOND"]).default("FREE"),
  expiresAt: z.string().datetime().optional(),
  productIds: z.array(z.string()).optional()
});

export const announcementSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  isActive: z.boolean().default(true)
});

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export const musicTrackSchema = z
  .object({
    title: z.string().min(1, "Vui lòng nhập tên bài hát."),
    artist: z.string().max(200).optional(),
    source: z.enum(["MP3", "YOUTUBE", "CLOUDINARY"]),
    url: z.string().min(1, "Vui lòng nhập URL hoặc mã video."),
    coverUrl: z.string().url().optional(),
    isActive: z.boolean().default(true)
  })
  .superRefine((data, ctx) => {
    if (data.source === "YOUTUBE") {
      // Accept either a bare 11-char video ID or a full watch/youtu.be URL —
      // normalized to the bare ID by the route handler before it's stored.
      const idFromUrl = data.url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (!YOUTUBE_ID_RE.test(data.url) && !idFromUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL hoặc mã video YouTube không hợp lệ.", path: ["url"] });
      }
    } else if (!z.string().url().safeParse(data.url).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL không hợp lệ.", path: ["url"] });
    }
  });
