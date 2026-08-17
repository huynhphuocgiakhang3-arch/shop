import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
// Crawlers fetch this on their own schedule, not on every visitor page view —
// regenerating it from the DB on every single request (force-dynamic) buys
// no real freshness benefit and just adds unnecessary DB load. An hourly
// ISR revalidation is more than fresh enough for search engine crawl
// schedules while cutting that load to near zero.
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");
  // Note: "/quen-mat-khau" (forgot password) is intentionally excluded — it's
  // disallowed in robots.ts, so listing it here would be a conflicting signal
  // (an indexable sitemap entry for a page crawlers are told not to fetch).
  const staticRoutes = ["/", "/san-pham", "/danh-muc", "/vault", "/thanh-vien", "/trung-tam-tro-giup", "/lien-he"].map(path => ({ url: `${base}${path}`, changeFrequency: path === "/" ? "daily" as const : "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      // Only categories that actually have at least one published product
      // are indexable landing pages (san-pham/page.tsx's generateMetadata
      // enforces the same rule) — an empty category isn't meaningful
      // crawlable content, so it's left out here too.
      prisma.category.findMany({ where: { products: { some: { status: "PUBLISHED" } } }, select: { slug: true } })
    ]);
    return [
      ...staticRoutes,
      ...products.map((p: { slug: string; updatedAt: Date }) => ({ url: `${base}/san-pham/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...categories.map((c: { slug: string }) => ({ url: `${base}/san-pham?category=${encodeURIComponent(c.slug)}`, changeFrequency: "weekly" as const, priority: 0.6 }))
    ];
  } catch { return staticRoutes; }
}
