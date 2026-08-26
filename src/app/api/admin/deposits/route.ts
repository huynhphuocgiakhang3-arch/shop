import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError, parsePagination, paginatedResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(searchParams);
    const status = searchParams.get("status");
    if (status && !STATUSES.has(status)) return jsonError("status không hợp lệ.", 422);

    const where = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {};

    const [items, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } }
      }),
      prisma.depositRequest.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "admin/deposits:GET");
  }
}
