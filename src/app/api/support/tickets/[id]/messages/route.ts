import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { supportMessageSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Vui lòng đăng nhập để tiếp tục.", 401);

    const body = await req.json().catch(() => null);
    const parsed = supportMessageSchema.safeParse(body);
    if (!parsed.success) return jsonError("Vui lòng nhập nội dung.", 422);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return jsonError("Không tìm thấy yêu cầu hỗ trợ.", 404);

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (ticket.userId !== user.sub && !isAdmin) return jsonError("Bạn không có quyền trả lời yêu cầu này.", 403);

    const message = await prisma.supportTicketMessage.create({
      data: { ticketId: ticket.id, authorId: user.sub, body: parsed.data.body, attachmentUrl: parsed.data.attachmentUrl }
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: isAdmin ? "IN_PROGRESS" : "OPEN", updatedAt: new Date() }
    });

    return jsonOk({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "support/tickets/[id]/messages:POST");
  }
}
