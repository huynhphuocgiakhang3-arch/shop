import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
// A product page's data (price, status, description) changes occasionally,
// not every second — force-dynamic re-queries Postgres on every single
// visit for zero real freshness gain. A short ISR window keeps pages fast
// (served from cache) while still picking up admin edits within a minute.
export const revalidate = 60;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

// Only PUBLISHED products get rich metadata/snippets — a DRAFT or ARCHIVED
// product should never surface a title/description/OG preview to crawlers or
// social scrapers, even if someone links directly to its slug.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, shortDescription: true, description: true, thumbnailUrl: true, updatedAt: true, price: true, discountPrice: true, status: true }
  });

  if (!product || product.status !== "PUBLISHED") {
    return { title: "Không tìm thấy sản phẩm", robots: { index: false, follow: false } };
  }

  const description = product.shortDescription || product.description.slice(0, 155);
  const canonical = `${SITE_URL}/san-pham/${params.slug}`;
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: { title: product.name, description, type: "website", url: canonical, images: product.thumbnailUrl ? [{ url: product.thumbnailUrl, alt: product.name }] : [] },
    twitter: { card: "summary_large_image", title: product.name, description, images: product.thumbnailUrl ? [product.thumbnailUrl] : [] }
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    select: { id: true, name: true, shortDescription: true, description: true, thumbnailUrl: true, price: true, discountPrice: true, slug: true, category: { select: { name: true, slug: true } } }
  });

  if (!product) return <>{children}</>;

  // Real aggregate only — no review data means no aggregateRating field at
  // all (an omitted field, not a fabricated 0 or 5).
  const ratingAgg = await prisma.review.aggregate({
    where: { productId: product.id, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true }
  });
  const reviewCount = ratingAgg._count._all;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    url: `${SITE_URL}/san-pham/${product.slug}`,
    ...(reviewCount > 0 && ratingAgg._avg.rating != null
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(ratingAgg._avg.rating.toFixed(1)), reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: Number(product.discountPrice ?? product.price),
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/san-pham/${product.slug}`
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${SITE_URL}/san-pham` },
      ...(product.category
        ? [{ "@type": "ListItem", position: 3, name: product.category.name, item: `${SITE_URL}/san-pham?category=${encodeURIComponent(product.category.slug)}` }]
        : []),
      { "@type": "ListItem", position: product.category ? 4 : 3, name: product.name, item: `${SITE_URL}/san-pham/${product.slug}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
