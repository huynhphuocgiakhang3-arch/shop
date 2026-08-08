import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exact shape returned by the query below.
 * Kept local so this route does not depend on Prisma helper types that may
 * differ between generated Prisma Client versions.
 */
type ConversationListRow = {
  id: string;
  needsHuman: boolean;
  lastMessageAt: Date;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  messages: Array<{
    id: string;
    sender: "USER" | "ADMIN" | "BOT";
    senderId: string | null;
    body: string;
    attachmentUrl: string | null;
    readByUserAt: Date | null;
    readByAdminAt: Date | null;
    createdAt: Date;
  }>;
  _count: {
    messages: number;
  };
};

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const conversations = (await prisma.conversation.findMany({
      orderBy: [{ needsHuman: "desc" }, { lastMessageAt: "desc" }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                sender: "USER",
                readByAdminAt: null
              }
            }
          }
        }
      }
    })) as ConversationListRow[];

    return jsonOk({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        needsHuman: conversation.needsHuman,
        lastMessageAt: conversation.lastMessageAt,
        user: conversation.user,
        lastMessage: conversation.messages[0] ?? null,
        unreadCount: conversation._count.messages
      }))
    });
  } catch (error) {
    return handleApiError(error, "admin/chat/conversations:GET");
  }
}
