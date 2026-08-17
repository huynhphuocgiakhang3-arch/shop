import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { getChatSettings, renderGreeting } from "@/lib/chat-settings";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireActiveUser();
    if (response) return response;

    const admin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN", isDeleted: false, isBanned: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true, avatarUrl: true }
    });

    const adminProfile = admin ?? {
      id: "super-admin",
      displayName: "AD.Khanghuynh",
      avatarUrl: null
    };

    let conversation = await prisma.conversation.findUnique({
      where: { userId: user.sub },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } }
    });

    if (!conversation) {
      const me = await prisma.user.findUnique({ where: { id: user.sub }, select: { displayName: true } });
      const settings = await getChatSettings();
      const greeting = renderGreeting(settings.greetingMessage, me?.displayName ?? "bạn");

      conversation = await prisma.conversation.create({
        data: {
          userId: user.sub,
          messages: {
            create: {
              sender: "ADMIN",
              senderId: admin?.id,
              body: greeting,
              readByAdminAt: new Date()
            }
          }
        },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } }
      });
    }

    return jsonOk({
      conversation: { id: conversation.id, needsHuman: conversation.needsHuman },
      admin: { displayName: adminProfile.displayName || "AD.Khanghuynh", avatarUrl: adminProfile.avatarUrl },
      messages: conversation.messages
    });
  } catch (error) {
    return handleApiError(error, "chat/conversation:GET");
  }
}
