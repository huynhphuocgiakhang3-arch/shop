import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy sản phẩm.", 404);
    if (existing.status !== "ARCHIVED") return jsonError("Sản phẩm này chưa được lưu trữ.", 400);

    const product = await prisma.product.update({ where: { id: params.id }, data: { status: "PUBLISHED" } });
    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error, "admin/products/[id]/restore:POST");
  }
}
