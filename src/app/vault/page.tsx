import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Vault — Không gian trưng bày sản phẩm",
  description: "Khám phá bộ sưu tập sản phẩm số nổi bật của KhangHuynh Vault trong một không gian trưng bày cao cấp.",
  alternates: { canonical: `${SITE_URL}/vault` },
  openGraph: {
    title: "KhangHuynh Vault — Showroom",
    description: "Không gian trưng bày sản phẩm số nổi bật.",
    url: `${SITE_URL}/vault`,
    type: "website"
  }
};

const vaultProductSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  thumbnailUrl: true,
  price: true,
  discountPrice: true,
  featureBullets: true,
  salesCount: true,
  isFeatured: true,
  isVipOnly: true,
  category: { select: { name: true } },
  _count: { select: { reviews: true } }
} as const;

async function getVaultProducts() {
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { salesCount: "desc" }],
    take: 12,
    select: vaultProductSelect
  });
}

type VaultProduct = Awaited<ReturnType<typeof getVaultProducts>>[number];
type RatingSummary = { averageRating: number; reviewCount: number };

export default async function VaultPage() {
  const products: VaultProduct[] = await getVaultProducts();
  type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
  const ratings = (await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((product) => product.id) }, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true }
  })) as RatingRow[];
  const ratingMap = new Map<string, RatingSummary>(
    ratings.map((row) => [row.productId, { averageRating: Number(row._avg.rating ?? 0), reviewCount: row._count._all }])
  );
  const data = products.map((product: VaultProduct) => ({
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice == null ? null : Number(product.discountPrice),
    averageRating: ratingMap.get(product.id)?.averageRating ?? 0,
    reviewCount: ratingMap.get(product.id)?.reviewCount ?? product._count.reviews
  }));

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <section className="khv-atmosphere relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-accent-orange/[.13] via-white/[.03] to-accent-blue/[.07] p-7 shadow-[0_30px_100px_rgba(0,0,0,.22)] sm:p-12">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-accent-orange">Showroom công khai</p>
          <h1 className="mt-3 max-w-3xl text-h1 font-display text-white">Không gian trưng bày sản phẩm</h1>
          <p className="mt-4 max-w-2xl text-small leading-7 text-white/55">
            Đây là showroom — khác với Vault cá nhân ở mục Tải xuống sau khi bạn đã mua.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/san-pham"><Button>Marketplace</Button></Link>
            <Link href="/tai-xuong"><Button variant="secondary">Vault của tôi</Button></Link>
          </div>
        </section>
        <div className="mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Showcase</p>
            <h2 className="mt-2 text-h2 font-display text-white">Bộ sưu tập nổi bật</h2>
          </div>
          <Link href="/san-pham" className="text-small text-accent-orange">Xem tất cả →</Link>
        </div>
        <div className="mt-7 grid khv-product-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
