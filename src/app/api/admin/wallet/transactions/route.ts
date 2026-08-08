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
    const status = req.nextUrl.searchParams.get("status");

    const where = status ? { status: status as "PENDING" | "COMPLETED" | "REJECTED" } : {};

    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { wallet: { include: { user: { select: { displayName: true, email: true } } } } }
      }),
      prisma.walletTransaction.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "admin/wallet/transactions:GET");
  }
}
