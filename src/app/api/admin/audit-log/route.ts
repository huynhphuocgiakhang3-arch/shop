import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security/audit trail (role changes, revoked downloads, payment settings
// edits, etc.) — SUPER_ADMIN only, same access tier as Appearance/System
// settings and Announcements, since this exposes every admin's actions
// across the whole platform.
export async function GET(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);
    const action = req.nextUrl.searchParams.get("action");

    const where = action ? { action: { contains: action, mode: "insensitive" as const } } : {};

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { user: { select: { displayName: true, email: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "admin/audit-log:GET");
  }
}
