import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);

    const [items, total] = await Promise.all([
      prisma.downloadToken.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { displayName: true, email: true } },
          product: { select: { name: true, slug: true } }
        }
      }),
      prisma.downloadToken.count()
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "admin/downloads:GET");
  }
}
