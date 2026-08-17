import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/user";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ.", 422);
  }

  const { token, password } = parsed.data;

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return jsonError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Resetting a password should invalidate every existing session.
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.auditLog.create({
        data: { userId: record.userId, action: "PASSWORD_RESET" }
      })
    ]);

    return jsonOk({ message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
  } catch (error) {
    logApiError("auth/reset-password", error);
    return jsonError("Đã xảy ra lỗi, vui lòng thử sau.", 500);
  }
}
