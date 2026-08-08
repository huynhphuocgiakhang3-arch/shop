import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user, response } = await requireActiveUser();
    if (response) return response;

    const conversation = await prisma.conversation.findUnique({ where: { userId: user.sub } });
    if (!conversation) return jsonOk({ updated: 0 });

    const result = await prisma.chatMessage.updateMany({
      where: { conversationId: conversation.id, sender: { in: ["ADMIN", "BOT"] }, readByUserAt: null },
      data: { readByUserAt: new Date() }
    });

    return jsonOk({ updated: result.count });
  } catch (error) {
    return handleApiError(error, "chat/read:POST");
  }
}
