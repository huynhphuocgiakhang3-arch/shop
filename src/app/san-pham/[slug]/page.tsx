import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { ProductDetailClient } from "./ProductDetailClient";
import type { ProductDetailResponse } from "@/hooks/useProducts";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

async function getProductPayload(slug: string): Promise<ProductDetailResponse | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { displayName: true, avatarUrl: true } },
          _count: { select: { likes: true } }
        }
      },
      _count: { select: { reviews: true, favorites: true } }
    }
  });

  if (!product || product.status !== "PUBLISHED") return null;

  const [ratingAgg, relatedRaw, user] = await Promise.all([
    prisma.review.aggregate({ where: { productId: product.id, isHidden: false }, _avg: { rating: true } }),
    prisma.product.findMany({
      where: { categoryId: product.categoryId, status: "PUBLISHED", NOT: { id: product.id } },
      take: 4,
      select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, discountPrice: true }
    }),
    getSessionUser()
  ]);

  let isFavorited = false;
  let hasPurchased = false;
  if (user) {
    const [favorite, purchase] = await Promise.all([
      prisma.favorite.findUnique({ where: { userId_productId: { userId: user.sub, productId: product.id } } }),
      prisma.orderItem.findFirst({ where: { productId: product.id, order: { userId: user.sub, status: "PAID" } } })
    ]);
    isFavorited = Boolean(favorite);
    hasPurchased = Boolean(purchase);
  }

  return {
    product: {
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice == null ? null : Number(product.discountPrice),
      averageRating: ratingAgg._avg.rating ?? 0,
      reviews: product.reviews.map((r: (typeof product.reviews)[number]) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isVerified: r.isVerified,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        _count: r._count
      }))
    } as ProductDetailResponse["product"],
    related: relatedRaw.map((p: (typeof relatedRaw)[number]) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice == null ? null : Number(p.discountPrice)
    })),
    isFavorited,
    hasPurchased
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const payload = await getProductPayload(params.slug);
  if (!payload) return { title: "Sản phẩm không khả dụng" };

  const { product } = payload;
  const url = `${SITE_URL}/san-pham/${product.slug}`;
  const priceLabel = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(product.discountPrice ?? product.price)
  );

  return {
    title: product.name,
    description: product.shortDescription || `${product.name} — ${priceLabel} tại KhangHuynh Vault. Giao hàng số tức thì.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.thumbnailUrl, width: 1200, height: 750, alt: product.name }]
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      images: [product.thumbnailUrl]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const payload = await getProductPayload(params.slug);

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-primary">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <GlassPanel radius="xl" className="flex flex-col items-center gap-4 p-8 sm:p-10">
            <h1 className="text-h2 font-display text-white">Sản phẩm không khả dụng</h1>
            <p className="text-small text-white/50">
              Sản phẩm này không tồn tại, đã bị gỡ hoặc tạm ngừng bán. Hãy khám phá các sản phẩm khác tại marketplace.
            </p>
            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/san-pham" className="khv-touch-target w-full sm:w-auto">
                <Button variant="primary" className="w-full">Xem sản phẩm khác</Button>
              </Link>
              <Link href="/" className="khv-touch-target w-full sm:w-auto">
                <Button variant="secondary" className="w-full">Về trang chủ</Button>
              </Link>
            </div>
          </GlassPanel>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const { product } = payload;
  const url = `${SITE_URL}/san-pham/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: [product.thumbnailUrl, ...(product.galleryUrls ?? [])],
    sku: product.id,
    url,
    brand: { "@type": "Brand", name: "KhangHuynh Vault" },
    ...(product.reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.reviews.length
          }
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: product.discountPrice ?? product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <ProductDetailClient slug={product.slug} initialData={payload} />
      </main>
      <SiteFooter />
    </div>
  );
}
