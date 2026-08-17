import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const store = cookies();
  const refreshToken = store.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!dbUser || dbUser.isDeleted || dbUser.isBanned) {
      await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      return NextResponse.json({ message: "Tài khoản không thể truy cập." }, { status: 403 });
    }

    // Rotate: revoke the old refresh token, issue a brand new pair. This
    // limits the blast radius if a refresh token is ever leaked/replayed.
    // IMPORTANT: sign with `dbUser.role`, not `payload.role` — the refresh
    // token's claim is whatever role the user had when they last logged in
    // or refreshed, which goes stale the moment an admin changes their role
    // in Neon. Re-reading from `dbUser` here is what makes a role change
    // actually take effect for the user instead of surviving in their
    // tokens until they log out and back in.
    const newAccessToken = await signAccessToken({ sub: payload.sub, role: dbUser.role });
    const newRefreshToken = await signRefreshToken({ sub: payload.sub, role: dbUser.role });

    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.sub,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const res = NextResponse.json({ message: "OK" });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
    res.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  } catch (error) {
    logApiError("auth/refresh", error);
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  }
}
