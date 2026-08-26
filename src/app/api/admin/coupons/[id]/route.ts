import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const isActive = body?.isActive as boolean | undefined;
    if (typeof isActive !== "boolean") return jsonError("Thiếu trạng thái kích hoạt.", 422);

    const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy mã giảm giá.", 404);

    const coupon = await prisma.coupon.update({ where: { id: params.id }, data: { isActive } });
    return jsonOk({ coupon });
  } catch (error) {
    return handleApiError(error, "admin/coupons/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    await prisma.coupon.delete({ where: { id: params.id } }).catch(() => null);
    return jsonOk({ message: "Đã xóa mã giảm giá." });
  } catch (error) {
    return handleApiError(error, "admin/coupons/[id]:DELETE");
  }
}
