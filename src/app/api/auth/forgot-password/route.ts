import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/user";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/same-origin";
import { generateSecureToken } from "@/lib/tokens";
import { sendTransactionalEmail, resetPasswordUrl } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_MESSAGE = "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const ip = clientIp(req);
  const limit = rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return jsonError("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429);

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError("Email không hợp lệ.", 422);

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    // Always return the same message — never reveal whether an account
    // exists for a given email.
    if (!user || user.isDeleted) return jsonOk({ message: GENERIC_MESSAGE });

    const token = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    });

    const link = resetPasswordUrl(token);
    console.info(`[auth/forgot-password] Reset link for ${user.email}: ${link}`);
    await sendTransactionalEmail({
      to: user.email,
      subject: "Đặt lại mật khẩu KhangHuynh Vault",
      text: `Bạn vừa yêu cầu đặt lại mật khẩu. Mở liên kết này trong vòng 60 phút:\n\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`
    });

    return jsonOk({ message: GENERIC_MESSAGE });
  } catch (error) {
    logApiError("auth/forgot-password", error);
    return jsonError("Đã xảy ra lỗi, vui lòng thử sau.", 500);
  }
}
