import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      prisma.notification.count({ where: { userId: user.sub, isRead: false } })
    ]);

    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error, "notifications:GET");
  }
}
