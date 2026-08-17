import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { announcementSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = announcementSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Thông tin thông báo không hợp lệ.", 422);

    const existing = await prisma.announcement.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy thông báo.", 404);

    const announcement = await prisma.announcement.update({ where: { id: params.id }, data: parsed.data });
    return jsonOk({ announcement });
  } catch (error) {
    return handleApiError(error, "admin/announcements/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    await prisma.announcement.delete({ where: { id: params.id } }).catch(() => null);
    return jsonOk({ message: "Đã xóa thông báo." });
  } catch (error) {
    return handleApiError(error, "admin/announcements/[id]:DELETE");
  }
}
