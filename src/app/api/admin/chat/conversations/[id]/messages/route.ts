import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

    const { user, response } = await requireAdmin();
    if (response) return response;

    const conversation = await prisma.conversation.findUnique({ where: { id: params.id } });
    if (!conversation) return jsonError("Không tìm thấy cuộc trò chuyện.", 404);

    const body = await req.json().catch(() => null);
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!text) return jsonError("Vui lòng nhập nội dung.", 422);
    const attachmentUrl = typeof body?.attachmentUrl === "string" ? body.attachmentUrl : undefined;

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "ADMIN",
        senderId: user.sub,
        body: text,
        attachmentUrl,
        readByAdminAt: new Date()
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), needsHuman: false }
    });

    await prisma.notification.create({
      data: { userId: conversation.userId, type: "SUPPORT", title: "Tin nhắn mới từ Admin", body: text.slice(0, 140) }
    });

    return jsonOk({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/chat/conversations/[id]/messages:POST");
  }
}
