import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { reviewSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Đánh giá không hợp lệ.", 422);

    const product = await prisma.product.findUnique({ where: { slug: params.slug } });
    if (!product) return jsonError("Không tìm thấy sản phẩm.", 404);

    const purchase = await prisma.orderItem.findFirst({
      where: { productId: product.id, order: { userId: user.sub, status: "PAID" } }
    });

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: user.sub } }
    });
    if (existing) return jsonError("Bạn đã đánh giá sản phẩm này rồi.", 409);

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.sub,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isVerified: Boolean(purchase)
      },
      include: { user: { select: { displayName: true, avatarUrl: true } } }
    });

    return jsonOk({ review }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "products/[slug]/reviews:POST");
  }
}
