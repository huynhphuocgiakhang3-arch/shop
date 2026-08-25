import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { requestMeta, writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  action: z.enum(["publish", "unpublish", "feature", "unfeature", "bestseller", "archive", "reset-metrics"]),
  confirm: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const parsed = bulkSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Yêu cầu không hợp lệ.", 422);

    if ((parsed.data.action === "archive" || parsed.data.action === "reset-metrics") && parsed.data.confirm !== true) {
      return jsonError("Thao tác này cần xác nhận.", 422);
    }

    const data =
      parsed.data.action === "publish"
        ? { status: "PUBLISHED" as const }
        : parsed.data.action === "unpublish"
          ? { status: "DRAFT" as const }
          : parsed.data.action === "archive"
            ? { status: "ARCHIVED" as const }
            : parsed.data.action === "feature"
              ? { isFeatured: true }
              : parsed.data.action === "unfeature"
                ? { isFeatured: false }
                : parsed.data.action === "bestseller"
                  ? { isBestseller: true }
                  : {
                      displayRatingMode: "AUTOMATIC" as const,
                      displayRating: null,
                      displayReviewCountMode: "AUTOMATIC" as const,
                      displayReviewCount: null,
                      displayBuyerCountMode: "AUTOMATIC" as const,
                      displayBuyerCount: null
                    };

    const result = await prisma.product.updateMany({
      where: { id: { in: parsed.data.ids } },
      data
    });

    await writeAuditLog({
      userId: user.sub,
      action: "SUPER_ADMIN_BULK_PRODUCTS",
      metadata: { action: parsed.data.action, ids: parsed.data.ids, count: result.count },
      ...requestMeta(req)
    });

    revalidatePath("/");
    revalidatePath("/san-pham");

    return jsonOk({ count: result.count });
  } catch (error) {
    return handleApiError(error, "admin/products/bulk:POST");
  }
}
