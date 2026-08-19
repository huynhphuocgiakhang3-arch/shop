import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";
import { jsonError, logApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/same-origin";
import { generateSecureToken } from "@/lib/tokens";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { findReferrerByCode } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasRequiredEnv() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_REFRESH_SECRET
  );
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const ip = clientIp(req);
  const limit = rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.allowed) return jsonError("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429);

  if (!hasRequiredEnv()) {
    console.error("[auth/register] Missing required environment variables.");
    return jsonError("Máy chủ đang được cấu hình. Vui lòng thử lại sau.", 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Yêu cầu không hợp lệ.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ.", 422);
  }

  const { displayName, email, password, referralCode } = parsed.data;

  try {
    // Check duplicate email with a clear user-facing message.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("Email này đã được đăng ký.", 409);

    const passwordHash = await bcrypt.hash(password, 12);

    // A referral code from a signup link is best-effort: an invalid/expired
    // code must never block account creation, so we look it up first and
    // silently ignore a miss rather than validating inside registerSchema.
    let referredById: string | undefined;
    if (referralCode) {
      const referrer = await findReferrerByCode(referralCode);
      if (referrer) referredById = referrer.id;
    }

    // Create user + wallet + cart atomically so partial state is impossible.
    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        referredById,
        wallet: { create: {} },
        cart: { create: {} }
      }
    });

    // Issue tokens immediately so the client can auto-login after registration
    // — no second round-trip required.
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken({ sub: user.id, role: user.role })
    ]);

    const forwardedFor = req.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        ipAddress: forwardedFor,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Fire-and-forget non-critical side-effects. Failures here must NOT
    // block or roll back the registration — email verification is a
    // convenience, not a hard requirement.
    Promise.allSettled([
      prisma.emailVerificationToken.create({
        data: {
          token: generateSecureToken(),
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }),
      prisma.auditLog.create({
        data: { userId: user.id, action: "REGISTER", ipAddress: forwardedFor, userAgent }
      })
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[auth/register] Side-effect ${i} failed:`, r.reason);
        }
      });
    });

    const isProd = process.env.NODE_ENV === "production";

    // Return 201 with the user payload AND set auth cookies so the browser
    // is fully authenticated the moment registration completes.
    const res = NextResponse.json(
      {
        message: "Đăng ký thành công.",
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
      },
      { status: 201 }
    );

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });

    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return res;
  } catch (error) {
    logApiError("auth/register", error);
    return jsonError("Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.", 500);
  }
}
