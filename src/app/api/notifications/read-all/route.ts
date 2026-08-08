import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    await prisma.notification.updateMany({ where: { userId: user.sub, isRead: false }, data: { isRead: true } });
    return jsonOk({ message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (error) {
    return handleApiError(error, "notifications/read-all:POST");
  }
}
