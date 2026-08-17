/**
 * In-memory fixed-window rate limiter, keyed by caller-provided string
 * (usually `${route}:${ip}`).
 *
 * Honest limitation: this only limits requests within a single running
 * serverless instance's memory. On Vercel, concurrent traffic can be
 * routed across multiple instances, so this is a real but partial
 * defense — not a substitute for an edge-level or Redis-backed limiter
 * (e.g. Upstash Ratelimit) in front of auth routes at real scale. It
 * still meaningfully slows down single-instance brute-force attempts.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
