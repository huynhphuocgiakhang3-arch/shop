import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string") || ids.length === 0) {
      return jsonError("Danh sách thứ tự không hợp lệ.", 422);
    }

    const count = await prisma.musicTrack.count({ where: { id: { in: ids } } });
    if (count !== ids.length) return jsonError("Danh sách bài hát không khớp với dữ liệu hiện tại.", 409);

    await prisma.$transaction(ids.map((id: string, index: number) => prisma.musicTrack.update({ where: { id }, data: { sortOrder: index } })));

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error, "admin/music/reorder:POST");
  }
}
