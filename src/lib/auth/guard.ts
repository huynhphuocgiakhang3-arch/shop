import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, getFreshSessionUser } from "./session";
import type { JwtPayload } from "./jwt";

type GuardResult =
  | { user: JwtPayload; response: null }
  | { user: null; response: NextResponse };

export async function requireUser(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Vui lòng đăng nhập để tiếp tục." },
        { status: 401 }
      )
    };
  }
  return { user, response: null };
}

/**
 * Like requireUser, but also rejects a banned/deleted account immediately —
 * even if their access token was issued before the ban. Use this on
 * sensitive user actions (checkout, wallet, downloads).
 */
export async function requireActiveUser(): Promise<GuardResult> {
  const user = await getFreshSessionUser();
  if (!user || user.isBanned) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Tài khoản của bạn hiện không thể thực hiện thao tác này." },
        { status: 403 }
      )
    };
  }
  return { user: { sub: user.sub, role: user.role }, response: null };
}

// RBAC checks below always re-read the role from Postgres (via
// getFreshSessionUser) rather than trusting the JWT claim. That's what makes
// a role edited directly in Neon take effect on the very next admin
// request — no waiting for the 15-minute access token to expire, no
// re-login required. A banned/deleted user is also rejected immediately,
// even mid-session.

export async function requireAdmin(): Promise<GuardResult> {
  const user = await getFreshSessionUser();
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Bạn không có quyền truy cập tính năng này." },
        { status: 403 }
      )
    };
  }
  return { user: { sub: user.sub, role: user.role }, response: null };
}

// SUPER_ADMIN has all ADMIN permissions plus the ability to perform
// destructive/irreversible operations: hard-delete users, change roles,
// directly edit wallet balances, and manage system-wide settings
// (Maintenance Mode, Appearance).
export async function requireSuperAdmin(): Promise<GuardResult> {
  const user = await getFreshSessionUser();
  if (!user || user.isBanned || user.role !== "SUPER_ADMIN") {
    return {
      user: null,
      response: NextResponse.json(
        { message: "Chỉ Super Admin mới có quyền thực hiện thao tác này." },
        { status: 403 }
      )
    };
  }
  return { user: { sub: user.sub, role: user.role }, response: null };
}

// Convenience helper for route handlers that accept both ADMIN and SUPER_ADMIN.
// Returns the payload when the role satisfies the requirement, or a 403 response.
export function isAdminOrSuperAdmin(user: JwtPayload | null): user is JwtPayload {
  return user !== null && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
}

// Route handler helper: reads the x-user-id / x-user-role headers injected
// by middleware (avoids re-verifying the JWT for every API route that
// middleware already protected). Falls back to full cookie verification for
// routes outside the middleware matcher (e.g. /api/*).
export function userFromRequest(req: NextRequest): JwtPayload | null {
  const id = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (id && role) return { sub: id, role };
  return null;
}
