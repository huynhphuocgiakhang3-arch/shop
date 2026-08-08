import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const rejectReason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "Không xác nhận được giao dịch chuyển khoản.";

    const deposit = await prisma.depositRequest.findUnique({ where: { id: params.id } });
    if (!deposit) return jsonError("Không tìm thấy yêu cầu nạp tiền.", 404);
    if (deposit.status !== "PENDING") return jsonError("Yêu cầu này đã được xử lý trước đó.", 409);

    const updated = await prisma.depositRequest.update({
      where: { id: deposit.id },
      data: { status: "REJECTED", rejectReason, reviewedById: actingUser.sub, reviewedAt: new Date() }
    });

    await prisma.notification.create({
      data: {
        userId: deposit.userId,
        type: "WALLET",
        title: "Yêu cầu nạp tiền bị từ chối",
        body: `Yêu cầu nạp ${Number(deposit.amount).toLocaleString("vi-VN")}đ đã bị từ chối. Lý do: ${rejectReason}`
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: actingUser.sub,
        action: "ADMIN_REJECT_DEPOSIT",
        metadata: { depositId: deposit.id, targetUserId: deposit.userId, amount: Number(deposit.amount), rejectReason }
      }
    });

    return jsonOk({ deposit: updated });
  } catch (error) {
    return handleApiError(error, "admin/deposits/[id]/reject:POST");
  }
}
