import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { couponSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ coupons });
  } catch (error) {
    return handleApiError(error, "admin/coupons:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Thông tin mã giảm giá không hợp lệ.", 422);

    const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
    if (existing) return jsonError("Mã giảm giá này đã tồn tại.", 409);

    const { productIds, ...rest } = parsed.data;
    const coupon = await prisma.coupon.create({
      data: {
        ...rest,
        code: rest.code.toUpperCase(),
        expiresAt: rest.expiresAt ? new Date(rest.expiresAt) : undefined,
        products: productIds ? { connect: productIds.map((id) => ({ id })) } : undefined
      }
    });

    return jsonOk({ coupon }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/coupons:POST");
  }
}
