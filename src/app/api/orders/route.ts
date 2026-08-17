import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status");

    const where = {
      userId: user.sub,
      ...(status && { status: status as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED" })
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { items: { include: { product: { select: { name: true, thumbnailUrl: true, slug: true } } } } }
      }),
      prisma.order.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "orders:GET");
  }
}
