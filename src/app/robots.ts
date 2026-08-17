import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/trang-chu", "/gio-hang", "/thanh-toan", "/vi", "/nap-tien", "/tai-xuong", "/dang-nhap", "/dang-ky", "/quen-mat-khau", "/yeu-thich", "/don-hang", "/ho-so", "/thong-bao", "/ho-tro"] }], sitemap: `${base.replace(/\/$/, "")}/sitemap.xml` };
}
