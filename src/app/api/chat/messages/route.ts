import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { generateBotReply } from "@/lib/chat-bot";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

    const { user, response } = await requireActiveUser();
    if (response) return response;

    const limit = rateLimit(`chat-message:${user.sub}:${clientIp(req)}`, 20, 60_000);
    if (!limit.allowed) return jsonError("Bạn gửi tin nhắn quá nhanh. Vui lòng chậm lại.", 429);

    const body = await req.json().catch(() => null);
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!text) return jsonError("Vui lòng nhập nội dung.", 422);
    if (text.length > 2000) return jsonError("Tin nhắn quá dài (tối đa 2000 ký tự).", 422);

    const attachmentUrl = typeof body?.attachmentUrl === "string" ? body.attachmentUrl : undefined;

    const conversation = await prisma.conversation.upsert({
      where: { userId: user.sub },
      update: {},
      create: { userId: user.sub }
    });

    const userMessage = await prisma.chatMessage.create({
      data: { conversationId: conversation.id, sender: "USER", body: text, attachmentUrl, readByUserAt: new Date() }
    });

    // Reply whenever the latest message is from the customer. If an admin has
    // just replied, stay quiet until the customer sends a new message. This
    // prevents the common "chat stops replying forever" state caused by a
    // previous hand-off flag while still allowing the bot to recover naturally.
    const lastAdminMessage = await prisma.chatMessage.findFirst({ where: { conversationId: conversation.id, sender: "ADMIN" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    const shouldBotReply = !lastAdminMessage || lastAdminMessage.createdAt < userMessage.createdAt;
    let botMessage = null;
    if (shouldBotReply) {
      const reply = await generateBotReply(user.sub, text);
      botMessage = await prisma.chatMessage.create({ data: { conversationId: conversation.id, sender: "BOT", body: reply.body } });
      await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date(), needsHuman: reply.handedOff } });
    } else {
      await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
    }

    return jsonOk({ userMessage, botMessage }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "chat/messages:POST");
  }
}
