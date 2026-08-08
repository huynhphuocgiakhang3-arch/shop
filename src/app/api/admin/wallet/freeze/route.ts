import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Single endpoint, boolean `frozen` in the body — mirrors the Maintenance
// Mode toggle pattern in src/lib/settings.ts rather than splitting into two
// routes for what's really one state flip.
export async function POST(req: NextRequest) {
  try {
    const { user: actingUser, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const frozen = body?.frozen;
    const reason = typeof body?.reason === "string" ? body.reason.trim() || null : null;

    if (!userId) return jsonError("Thiếu người dùng.", 400);
    if (typeof frozen !== "boolean") return jsonError("frozen phải là true/false.", 422);
    if (frozen && !reason) return jsonError("Vui lòng nhập lý do đóng băng ví.", 422);

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: frozen
        ? { frozen: true, frozenReason: reason, frozenAt: new Date(), frozenById: actingUser.sub }
        : { frozen: false, frozenReason: null, frozenAt: null, frozenById: null }
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "WALLET",
        title: frozen ? "Ví của bạn đã bị tạm khóa" : "Ví của bạn đã được mở khóa",
        body: frozen ? `Lý do: ${reason}` : "Bạn có thể tiếp tục sử dụng ví bình thường."
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: actingUser.sub,
        action: frozen ? "ADMIN_FREEZE_WALLET" : "ADMIN_UNFREEZE_WALLET",
        metadata: { targetUserId: userId, reason }
      }
    });

    return jsonOk({ wallet: updated });
  } catch (error) {
    return handleApiError(error, "admin/wallet/freeze:POST");
  }
}
