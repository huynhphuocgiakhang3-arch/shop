import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification || notification.userId !== user.sub) {
      return jsonError("Không tìm thấy thông báo.", 404);
    }

    const updated = await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
    return jsonOk({ notification: updated });
  } catch (error) {
    return handleApiError(error, "notifications/[id]/read:PATCH");
  }
}
