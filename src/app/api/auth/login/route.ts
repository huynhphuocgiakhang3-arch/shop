import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasRequiredAuthEnv() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_REFRESH_SECRET
  );
}

// Always returns a well-formed JSON body so the client `res.json()` call
// never throws regardless of status code.
function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(req: NextRequest) {
  // ── CSRF guard ────────────────────────────────────────────────────────────
  // Uses x-forwarded-host (set by Vercel / reverse proxy) before falling
  // back to the raw Host header, so this check works correctly on all
  // Vercel deployment environments including preview URLs.
  if (!isSameOrigin(req)) {
    return errorResponse("Yêu cầu không hợp lệ.", 403);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = clientIp(req);
  const limit = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
  if (!limit.allowed) {
    return errorResponse("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429);
  }

  // ── Environment guard ─────────────────────────────────────────────────────
  if (!hasRequiredAuthEnv()) {
    console.error(
      "[auth/login] Missing required environment variables: DATABASE_URL / JWT_ACCESS_SECRET / JWT_REFRESH_SECRET"
    );
    return errorResponse("Máy chủ đang được cấu hình. Vui lòng thử lại sau.", 503);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Yêu cầu không hợp lệ.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Thông tin đăng nhập không hợp lệ.";
    return errorResponse(firstError, 422);
  }

  const { email, password } = parsed.data;

  // ── Auth logic ────────────────────────────────────────────────────────────
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isDeleted) {
      return errorResponse("Email hoặc mật khẩu không đúng.", 401);
    }

    if (user.isBanned) {
      return errorResponse("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.", 403);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return errorResponse("Email hoặc mật khẩu không đúng.", 401);
    }

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

    // Fire-and-forget audit log — failure must not block the login response.
    prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: "LOGIN_SUCCESS",
          ipAddress: forwardedFor,
          userAgent
        }
      })
      .catch((err: unknown) => {
        console.error("[auth/login] Failed to write audit log:", err);
      });

    const isProd = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15 // 15 minutes
    });

    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return res;
  } catch (error) {
    // Log the real error server-side for debugging, never expose internals
    // to the client. The response is always a valid JSON body so the
    // client's `res.json()` never throws and the UI shows a readable message
    // instead of falling into the generic catch block.
    logApiError("auth/login", error);
    return errorResponse("Đăng nhập thất bại. Vui lòng thử lại.", 500);
  }
}
