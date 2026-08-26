import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 200 }
      }
    });
    if (!conversation) return jsonError("Không tìm thấy cuộc trò chuyện.", 404);

    await prisma.chatMessage.updateMany({
      where: { conversationId: conversation.id, sender: "USER", readByAdminAt: null },
      data: { readByAdminAt: new Date() }
    });

    return jsonOk({ conversation });
  } catch (error) {
    return handleApiError(error, "admin/chat/conversations/[id]:GET");
  }
}
