import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { productUpdateSchema } from "@/lib/validations/product";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { requestMeta, writeAuditLog } from "@/lib/audit";
import { validateManagedMetrics } from "@/lib/commerce/display-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Thông tin sản phẩm không hợp lệ.", 422);
    }

    const metricError = validateManagedMetrics(parsed.data);
    if (metricError) return jsonError(metricError, 422);

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy sản phẩm.", 404);

    let categoryId = parsed.data.categoryId;
    if (categoryId === "" || categoryId === undefined) {
      const fallback = await prisma.category.upsert({
        where: { slug: "chua-phan-loai" },
        update: {},
        create: { name: "Chưa phân loại", slug: "chua-phan-loai", order: 9999 }
      });
      categoryId = fallback.id;
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        categoryId,
        previewVideoUrl: parsed.data.previewVideoUrl || undefined,
        fileUrl: parsed.data.fileUrl || undefined
      }
    });

    // Invalidate the public catalog immediately so edits (including feature
    // bullets) are visible on the first homepage render instead of only after
    // navigating through the marketplace.
    revalidatePath("/");
    revalidatePath("/san-pham");
    revalidatePath(`/san-pham/${product.slug}`);

    await writeAuditLog({
      userId: user.sub,
      action: "SUPER_ADMIN_UPDATE_PRODUCT",
      metadata: { productId: product.id, slug: product.slug },
      ...requestMeta(req)
    });

    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error, "admin/products/[id]:PATCH");
  }
}

// "Delete" archives rather than hard-deletes, so historical orders/reviews
// that reference the product stay intact — real deletion is a separate,
// explicit operation admins rarely want by accident.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy sản phẩm.", 404);

    const product = await prisma.product.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
    revalidatePath("/");
    revalidatePath("/san-pham");
    revalidatePath(`/san-pham/${product.slug}`);
    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error, "admin/products/[id]:DELETE");
  }
}
