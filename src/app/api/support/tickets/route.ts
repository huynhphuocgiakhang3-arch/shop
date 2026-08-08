import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { supportTicketSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status");

    const where = {
      ...(isAdmin ? {} : { userId: user.sub }),
      ...(status && { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" })
    };

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { displayName: true, email: true } },
          _count: { select: { messages: true } }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "support/tickets:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = supportTicketSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ.", 422);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.sub,
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        messages: { create: { authorId: user.sub, body: parsed.data.body } }
      },
      include: { messages: true }
    });

    return jsonOk({ ticket }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "support/tickets:POST");
  }
}
