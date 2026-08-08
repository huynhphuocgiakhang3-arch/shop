/**
 * CSRF mitigation for cookie-authenticated state-changing requests.
 *
 * Strategy: compare the request's `Origin` header against the effective
 * public host of the server. We intentionally check both `host` and
 * `x-forwarded-host` because reverse proxies (Vercel Edge Network,
 * Nginx, Cloudflare, etc.) forward the real public hostname in
 * `x-forwarded-host` while setting `host` to an internal value such as
 * `localhost:3000` or an internal load-balancer address.
 *
 * Fallback order (first truthy value wins):
 *   1. x-forwarded-host  — set by Vercel / any reverse proxy
 *   2. host              — the raw TCP-level Host header
 *
 * If neither header is present the request cannot be verified and we
 * return false (deny).  If Origin is absent we allow the request: all
 * modern browsers omit Origin only on same-origin navigations, so its
 * absence is itself a signal that the request is legitimate (not a
 * cross-origin fetch from a third-party page).
 *
 * This check is a defence-in-depth layer on top of the primary CSRF
 * protection provided by the `httpOnly` + `SameSite=Lax` cookies used
 * for access/refresh tokens; it is NOT the only CSRF guard.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  // No Origin header → same-origin navigation or a non-CORS request;
  // browsers always set Origin on cross-origin fetches, so absence means safe.
  if (!origin) return true;

  // Resolve the effective public host, preferring x-forwarded-host so
  // that deployments behind Vercel / Nginx / Cloudflare work correctly.
  const effectiveHost =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host");

  if (!effectiveHost) return false;

  // x-forwarded-host can be a comma-separated list when requests pass
  // through multiple proxies — take only the first (leftmost) entry,
  // which is the original client-facing host.
  const publicHost = effectiveHost.split(",")[0]?.trim();
  if (!publicHost) return false;

  try {
    // new URL(origin).host strips the scheme and normalises the port,
    // giving us a plain "hostname" or "hostname:port" string to compare.
    return new URL(origin).host === publicHost;
  } catch {
    // Malformed Origin value — deny.
    return false;
  }
}
