import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { announcementSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ announcements });
  } catch (error) {
    return handleApiError(error, "admin/announcements:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) return jsonError("Thông tin thông báo không hợp lệ.", 422);

    const announcement = await prisma.announcement.create({ data: parsed.data });
    return jsonOk({ announcement }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/announcements:POST");
  }
}
