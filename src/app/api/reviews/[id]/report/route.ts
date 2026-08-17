import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { reportReviewSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = reportReviewSchema.safeParse(body);
    if (!parsed.success) return jsonError("Vui lòng nêu lý do báo cáo.", 422);

    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return jsonError("Không tìm thấy đánh giá.", 404);

    const existing = await prisma.reviewReport.findUnique({
      where: { reviewId_userId: { reviewId: params.id, userId: user.sub } }
    });
    if (existing) return jsonError("Bạn đã báo cáo đánh giá này rồi.", 409);

    await prisma.reviewReport.create({ data: { reviewId: params.id, userId: user.sub, reason: parsed.data.reason } });
    return jsonOk({ message: "Đã gửi báo cáo. Cảm ơn bạn." }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "reviews/[id]/report:POST");
  }
}
