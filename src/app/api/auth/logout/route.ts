import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const store = cookies();
    const refreshToken = store.get("refresh_token")?.value;

    if (refreshToken) {
      // Non-fatal: if the DB call fails we still clear the cookies so the
      // browser session ends — the token will expire naturally on its own.
      prisma.refreshToken
        .updateMany({
          where: { token: refreshToken, revokedAt: null },
          data: { revokedAt: new Date() }
        })
        .catch((err: unknown) => {
          console.error("[auth/logout] Failed to revoke refresh token in DB:", err);
        });
    }

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = { path: "/", maxAge: 0, httpOnly: true, secure: isProd, sameSite: "lax" } as const;

    const res = NextResponse.json({ message: "Đã đăng xuất." });
    res.cookies.set("access_token", "", cookieOptions);
    res.cookies.set("refresh_token", "", cookieOptions);
    return res;
  } catch (error) {
    return handleApiError(error, "auth/logout:POST");
  }
}
