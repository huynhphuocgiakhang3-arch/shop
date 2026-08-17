import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

/**
 * Root cause of the Vercel build failure:
 *
 * Next.js's "Collecting page data" build step imports every route module
 * (and everything that module imports) in a plain Node process purely to
 * read static exports like `runtime` / `dynamic`. It does NOT call the
 * route's POST/GET handlers — but it DOES execute top-level module code.
 *
 * The previous version of this file called `new PrismaClient()` at module
 * scope. Prisma's constructor eagerly resolves the datasource URL from
 * `process.env.DATABASE_URL`, and throws a `PrismaClientInitializationError`
 * immediately if that variable isn't present in the environment the code
 * is currently running in. If `DATABASE_URL` is missing (or simply not
 * yet available) during the Vercel build step, that throw happens while
 * Next.js is just trying to import the module — which surfaces as the
 * generic wrapper error "Failed to collect page data for /api/auth/login".
 *
 * Fix: never construct PrismaClient at import time. `prisma` below is a
 * Proxy that only builds (and caches) the real client the first time one
 * of its properties is actually used — which only ever happens inside a
 * request handler at runtime, never during the build's static import
 * pass. This also keeps the familiar `prisma.user.findUnique(...)` call
 * sites working unchanged everywhere else in the codebase.
 */
function getPrismaClient(): PrismaClient {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  return global.__prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  }
});
