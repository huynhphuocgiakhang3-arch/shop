import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/user";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guard";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const { user, response } = await requireUser();
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Yêu cầu không hợp lệ.", 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ.", 422);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return jsonError("Không tìm thấy tài khoản.", 404);

    const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
    if (!valid) return jsonError("Mật khẩu hiện tại không đúng.", 401);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: user.sub }, data: { passwordHash } });

    // Invalidate all other sessions after password change for security.
    await prisma.refreshToken.updateMany({
      where: { userId: user.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    // Fire-and-forget audit log.
    prisma.auditLog
      .create({ data: { userId: user.sub, action: "PASSWORD_CHANGED" } })
      .catch((err: unknown) => console.error("[auth/change-password] Audit log failed:", err));

    return jsonOk({ message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
  } catch (error) {
    logApiError("auth/change-password", error);
    return jsonError("Đã xảy ra lỗi, vui lòng thử sau.", 500);
  }
}
