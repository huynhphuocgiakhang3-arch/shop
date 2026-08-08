import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return jsonError("Thiếu mã xác minh.", 400);

  try {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return jsonError("Liên kết xác minh không hợp lệ hoặc đã hết hạn.", 400);
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    ]);

    return jsonOk({ message: "Xác minh email thành công." });
  } catch (error) {
    logApiError("auth/verify-email", error);
    return jsonError("Đã xảy ra lỗi, vui lòng thử sau.", 500);
  }
}
