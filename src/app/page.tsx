import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { ProductGridSection } from "@/components/home/ProductGridSection";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FAQSection } from "@/components/home/FAQSection";
import type { ProductCardData } from "@/components/home/ProductCard";

export const dynamic = "force-dynamic"; // homepage reflects live catalog/stats, never statically cached
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "KhangHuynh Vault — Nền tảng thương mại số cao cấp",
  description:
    "Khám phá phần mềm, tài khoản, tài nguyên thiết kế và dịch vụ số được tuyển chọn kỹ lưỡng trên KhangHuynh Vault.",
  openGraph: {
    title: "KhangHuynh Vault",
    description: "Nền tảng thương mại số cao cấp — bảo mật, minh bạch, giao hàng tức thì.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "KhangHuynh Vault",
    description: "Nền tảng thương mại số cao cấp."
  }
};

const PRODUCT_CARD_SELECT = {
  name: true,
  slug: true,
  shortDescription: true,
  thumbnailUrl: true,
  price: true,
  discountPrice: true,
  salesCount: true,
  isFeatured: true,
  isVipOnly: true,
  category: { select: { name: true } }
} as const;

// Prisma `Decimal` fields are class instances, not plain serializable
// objects — passing them straight from a Server Component into a "use
// client" component (ProductCard) throws at runtime. This helper converts
// the Prisma result (with Decimal price fields) into a plain ProductCardData
// object (with number price fields) that is safe to pass across the
// server/client boundary.
type PrismaProduct = {
  name: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: unknown;
  discountPrice: unknown;
  salesCount: number;
  isFeatured: boolean;
  isVipOnly: boolean;
  category: { name: string } | null;
};

function serializeProduct(p: PrismaProduct): ProductCardData {
  return {
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    thumbnailUrl: p.thumbnailUrl,
    price: Number(p.price),
    discountPrice: p.discountPrice == null ? null : Number(p.discountPrice),
    salesCount: p.salesCount,
    isFeatured: p.isFeatured,
    isVipOnly: p.isVipOnly,
    category: p.category
  };
}

export default async function HomePage() {
  const [featured, latest, popular, categories, reviews, productCount, userCount, orderCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: PRODUCT_CARD_SELECT
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: PRODUCT_CARD_SELECT
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      take: 8,
      orderBy: { salesCount: "desc" },
      select: PRODUCT_CARD_SELECT
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      take: 8,
      select: { slug: true, name: true, icon: true, _count: { select: { products: true } } }
    }),
    prisma.review.findMany({
      where: { isHidden: false, isVerified: true, comment: { not: null } },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        user: { select: { displayName: true, avatarUrl: true } },
        product: { select: { name: true } }
      }
    }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.order.count({ where: { status: "PAID" } })
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main>
        <Hero />
        <ProductGridSection title="Sản phẩm nổi bật" products={featured.map(serializeProduct)} />
        <CategoriesGrid categories={categories} />
        <ProductGridSection title="Mới nhất" products={latest.map(serializeProduct)} />
        <ProductGridSection title="Bán chạy nhất" products={popular.map(serializeProduct)} />
        <StatsSection
          stats={[
            { label: "Sản phẩm", value: productCount },
            { label: "Thành viên", value: userCount },
            { label: "Đơn hàng đã hoàn tất", value: orderCount },
            { label: "Đánh giá 5 sao", value: reviews.filter((r: { rating: number }) => r.rating === 5).length }
          ]}
        />
        <ReviewsSection reviews={reviews} />
        <div id="faq">
          <FAQSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
