import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return jsonError("Không tìm thấy đánh giá.", 404);

    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId: params.id, userId: user.sub } }
    });

    if (existing) {
      await prisma.reviewLike.delete({ where: { id: existing.id } });
      return jsonOk({ liked: false });
    }

    await prisma.reviewLike.create({ data: { reviewId: params.id, userId: user.sub } });
    return jsonOk({ liked: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "reviews/[id]/like:POST");
  }
}
