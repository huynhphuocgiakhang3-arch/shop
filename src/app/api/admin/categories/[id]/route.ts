import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { categorySchema } from "@/lib/validations/product";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Thông tin danh mục không hợp lệ.", 422);
    }

    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy danh mục.", 404);

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { ...parsed.data, bannerUrl: parsed.data.bannerUrl || undefined }
    });

    return jsonOk({ category });
  } catch (error) {
    return handleApiError(error, "admin/categories/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const productCount = await prisma.product.count({ where: { categoryId: params.id } });
    if (productCount > 0) {
      return jsonError("Không thể xóa danh mục còn sản phẩm. Vui lòng chuyển sản phẩm trước.", 409);
    }

    await prisma.category.delete({ where: { id: params.id } });
    return jsonOk({ message: "Đã xóa danh mục." });
  } catch (error) {
    return handleApiError(error, "admin/categories/[id]:DELETE");
  }
}
