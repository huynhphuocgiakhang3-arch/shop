import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

// Runs on (almost) every page route, not just protected ones. Two jobs:
//
// 1. Protect /admin/* and the dashboard route group exactly as before —
//    this remains the authoritative, un-bypassable auth gate.
// 2. Stamp every request with an `x-pathname` header so the root layout
//    (a Node.js Server Component, which CAN query Postgres — middleware/edge
//    cannot) knows which route is being requested and can gate Maintenance
//    Mode without needing a DB call here at the edge.
//
// Excludes Next internals, the favicon, and any request for a file with an
// extension (static assets under /public) so those aren't needlessly routed
// through middleware.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};

const PROTECTED_PREFIXES = [
  "/admin",
  "/trang-chu",
  "/vi",
  "/don-hang",
  "/gio-hang",
  "/thanh-toan",
  "/tai-xuong",
  "/thong-bao",
  "/ho-so",
  "/ho-tro",
  "/yeu-thich"
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public route: just tag the pathname and let it through ──────────────
  if (!isProtectedPath(pathname)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = req.cookies.get("access_token")?.value;

  // ── No token: redirect to login with return URL ──────────────────────────
  if (!token) {
    const loginUrl = new URL("/dang-nhap", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyAccessToken(token);

    // ── Admin routes: require ADMIN or SUPER_ADMIN ───────────────────────
    if (pathname.startsWith("/admin")) {
      if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/trang-chu", req.url));
      }
    }

    // Attach user info as request headers so server components can read
    // role/userId without re-verifying the token (avoids double crypto work).
    // Note: this is only a fast hint — anything security-sensitive (admin
    // guards, role checks) re-reads the role fresh from Postgres server-side,
    // since a JWT claim can be up to 15 minutes stale after a role change.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-pathname", pathname);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Token is present but invalid/expired — clear it and redirect to login.
    const loginUrl = new URL("/dang-nhap", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    return res;
  }
}
