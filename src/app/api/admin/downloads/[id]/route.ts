import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: actingUser, response } = await requireAdmin();
    if (response) return response;

    const token = await prisma.downloadToken.findUnique({ where: { id: params.id } });
    if (!token) return jsonError("Không tìm thấy liên kết tải xuống.", 404);

    // Revoking sets an already-past expiry rather than deleting the row, so
    // the download/audit history for the order stays intact.
    await prisma.downloadToken.update({ where: { id: params.id }, data: { expiresAt: new Date(0) } });

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_REVOKE_DOWNLOAD", metadata: { downloadTokenId: params.id } }
    });

    return jsonOk({ message: "Đã thu hồi quyền tải xuống." });
  } catch (error) {
    return handleApiError(error, "admin/downloads/[id]:POST");
  }
}
