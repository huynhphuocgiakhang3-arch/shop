import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const isHidden = body?.isHidden as boolean | undefined;
    if (typeof isHidden !== "boolean") return jsonError("Thiếu trạng thái ẩn/hiện.", 422);

    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return jsonError("Không tìm thấy đánh giá.", 404);

    const updated = await prisma.review.update({ where: { id: params.id }, data: { isHidden } });
    return jsonOk({ review: updated });
  } catch (error) {
    return handleApiError(error, "admin/reviews/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return jsonError("Không tìm thấy đánh giá.", 404);

    await prisma.review.delete({ where: { id: params.id } });
    return jsonOk({ message: "Đã xóa đánh giá." });
  } catch (error) {
    return handleApiError(error, "admin/reviews/[id]:DELETE");
  }
}
