import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Vui lòng đăng nhập để tiếp tục.", 401);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { displayName: true, email: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { displayName: true, avatarUrl: true, role: true } } } }
      }
    });

    if (!ticket) return jsonError("Không tìm thấy yêu cầu hỗ trợ.", 404);
    if (ticket.userId !== user.sub && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return jsonError("Bạn không có quyền xem yêu cầu này.", 403);
    }

    return jsonOk({ ticket });
  } catch (error) {
    return handleApiError(error, "support/tickets/[id]:GET");
  }
}
