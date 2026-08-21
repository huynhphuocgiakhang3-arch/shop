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
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { WhyVaultSection } from "@/components/home/WhyVaultSection";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { getSiteSettings } from "@/lib/settings";
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
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  thumbnailUrl: true,
  price: true,
  discountPrice: true,
  salesCount: true,
  isFeatured: true,
  isVipOnly: true,
  featureBullets: true,
  category: { select: { name: true } }
} as const;

// Prisma `Decimal` fields are class instances, not plain serializable
// objects — passing them straight from a Server Component into a "use
// client" component (ProductCard) throws at runtime. This helper converts
// the Prisma result (with Decimal price fields) into a plain ProductCardData
// object (with number price fields) that is safe to pass across the
// server/client boundary.
async function getProductCards() {
  return prisma.product.findMany({ select: PRODUCT_CARD_SELECT });
}

type PrismaProduct = Awaited<ReturnType<typeof getProductCards>>[number];

type RatingSummary = { averageRating: number; reviewCount: number };

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: unknown;
  discountPrice: unknown | null;
  salesCount: number;
  isFeatured: boolean;
  isVipOnly: boolean;
  featureBullets: string[];
  category: { name: string } | null;
};

function compactSocialCount(value: number) {
  if (value < 1000) return String(value);
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor((value % 1000) / 100);
  return hundreds ? `${thousands}k${hundreds}+` : `${thousands}k+`;
}

function serializeProduct(p: PrismaProduct, rating?: RatingSummary): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    thumbnailUrl: p.thumbnailUrl,
    price: Number(p.price),
    discountPrice: p.discountPrice == null ? null : Number(p.discountPrice),
    salesCount: p.salesCount,
    isFeatured: p.isFeatured,
    isVipOnly: p.isVipOnly,
    featureBullets: p.featureBullets,
    category: p.category,
    averageRating: rating?.averageRating ?? 0,
    reviewCount: rating?.reviewCount ?? 0
  };
}

export default async function HomePage() {
  const [featured, latest, popular, categories, reviews, productCount, userCount, orderCount, fiveStarCount, siteSettings, faqs] = await Promise.all([
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
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.review.count({ where: { rating: 5, isHidden: false } }),
    getSiteSettings(),
    prisma.faqItem.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 12, select: { id: true, question: true, answer: true } })
  ]);

  const allProducts = [...featured, ...latest, ...popular];
  type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
  const ratingRows = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: allProducts.map((p) => p.id) }, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true }
  }) as RatingRow[];
  const ratingMap = new Map<string, { averageRating: number; reviewCount: number }>(
    ratingRows.map((r) => [r.productId, { averageRating: Number(r._avg.rating ?? 0), reviewCount: r._count._all }])
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main>
        <Hero settings={{
          announcementEnabled: siteSettings.announcementEnabled,
          announcementText: siteSettings.announcementText,
          heroPrimaryLine: siteSettings.heroPrimaryLine,
          heroVariantLine: siteSettings.heroVariantLine,
          heroVaultLine: siteSettings.heroVaultLine,
          heroDescription: siteSettings.heroDescription,
          heroDescriptionColor: siteSettings.heroDescriptionColor,
          heroPrimaryCta: siteSettings.heroPrimaryCta,
          heroSecondaryCta: siteSettings.heroSecondaryCta
        }} />
        <ProductGridSection title="Sản phẩm nổi bật" subtitle="Những tài sản được chọn để tạo ấn tượng ngay từ lần đầu khám phá." products={featured.map((p: ProductCardRow) => serializeProduct(p, ratingMap.get(p.id)))} />
        <CategoriesGrid categories={categories} />
        <ProductGridSection title="Mới nhất" subtitle="Những sản phẩm vừa xuất hiện trong Vault." products={latest.map((p: ProductCardRow) => serializeProduct(p, ratingMap.get(p.id)))} />
        <ProductGridSection title="🔥 Đang được quan tâm" subtitle="Xếp theo số lượt mua — chỉ hiển thị dữ liệu thật từ catalog." products={popular.map((p: ProductCardRow) => serializeProduct(p, ratingMap.get(p.id)))} />
        <WhyVaultSection />
        <RecentlyViewedSection products={[...featured, ...latest, ...popular].map((p: ProductCardRow) => serializeProduct(p, ratingMap.get(p.id)))} />
        <StatsSection
          stats={[
            { label: "Sản phẩm", value: productCount },
            { label: "Thành viên", value: userCount, displayValue: siteSettings.memberDisplay ?? compactSocialCount(userCount) },
            { label: "Đơn hàng đã hoàn tất", value: orderCount },
            { label: "Đánh giá 5 sao", value: fiveStarCount, displayValue: siteSettings.fiveStarDisplay ?? compactSocialCount(fiveStarCount) }
          ]}
        />
        <ReviewsSection reviews={reviews} />
        <FAQSection />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item: { id: string; question: string; answer: string }) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))
        }) }} />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
