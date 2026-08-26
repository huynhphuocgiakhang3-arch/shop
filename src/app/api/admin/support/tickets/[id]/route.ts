import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const status = body?.status as string | undefined;
    const priority = body?.priority as string | undefined;

    if (status && !STATUSES.includes(status)) return jsonError("Trạng thái không hợp lệ.", 422);
    if (priority && !PRIORITIES.includes(priority)) return jsonError("Mức độ ưu tiên không hợp lệ.", 422);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return jsonError("Không tìm thấy yêu cầu hỗ trợ.", 404);

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        status: (status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") ?? undefined,
        priority: (priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? undefined
      }
    });

    return jsonOk({ ticket: updated });
  } catch (error) {
    return handleApiError(error, "admin/support/tickets/[id]:PATCH");
  }
}
