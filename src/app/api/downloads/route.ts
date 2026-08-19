import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { generateSecureToken } from "@/lib/tokens";
import { jsonError, jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);

    const [items, total] = await Promise.all([
      prisma.downloadToken.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { product: { select: { name: true, thumbnailUrl: true, slug: true, version: true, fileSizeMb: true } } }
      }),
      prisma.downloadToken.count({ where: { userId: user.sub } })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "downloads:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const orderItemId = body?.orderItemId as string | undefined;
    if (!orderItemId) return jsonError("Thiếu thông tin sản phẩm.", 400);

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true }
    });

    if (!orderItem || orderItem.order.userId !== user.sub || orderItem.order.status !== "PAID") {
      return jsonError("Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được thanh toán.", 403);
    }

    let existing = await prisma.downloadToken.findFirst({
      where: { orderItemId, userId: user.sub },
      orderBy: { createdAt: "desc" }
    });

    if (!existing) {
      existing = await prisma.downloadToken.create({
        data: { token: generateSecureToken(), userId: user.sub, productId: orderItem.productId, orderItemId }
      });
    }

    return jsonOk({ downloadUrl: `/api/downloads/${existing.token}` });
  } catch (error) {
    return handleApiError(error, "downloads:POST");
  }
}
