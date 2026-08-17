import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const isHidden = body?.isHidden as boolean | undefined;
    const rating = body?.rating as number | undefined;
    const comment = body?.comment as string | null | undefined;
    if (isHidden === undefined && rating === undefined && comment === undefined) return jsonError("Không có thay đổi.", 422);
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return jsonError("Số sao phải từ 1 đến 5.", 422);
    const { response: superResponse } = await requireSuperAdmin();
    if (superResponse) return superResponse;

    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return jsonError("Không tìm thấy đánh giá.", 404);

    const updated = await prisma.review.update({ where: { id: params.id }, data: { ...(typeof isHidden === "boolean" ? { isHidden } : {}), ...(rating !== undefined ? { rating } : {}), ...(comment !== undefined ? { comment } : {}) } });
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
