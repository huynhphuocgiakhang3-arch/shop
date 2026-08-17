import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");
const DEFAULT_SORT = "newest";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Deterministic canonical/index strategy for every /san-pham query-string
// combination (Phase 3 of the marketplace SEO spec):
//
//  - No params, or only a `category` slug that resolves to a real category
//    → indexable, self-referencing canonical. A category landing page is
//    "meaningful crawlable content" per the spec, so it earns its own entry.
//  - A search term, a non-default sort, page > 1, a price filter, or a
//    category slug that doesn't actually exist → noindex,follow, with the
//    canonical pointed at the cleanest indexable equivalent (the category
//    landing page if one applies, otherwise the bare marketplace).
//
// This guarantees no URL is ever both "indexable" and "noindex" for the
// same state, and the near-infinite combinations of q/sort/page/price never
// become their own indexable duplicates.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = first(searchParams.q)?.trim();
  const categorySlug = first(searchParams.category)?.trim();
  const sort = first(searchParams.sort)?.trim();
  const pageRaw = first(searchParams.page);
  const pageNum = Number(pageRaw);
  const isPagedBeyondFirst = pageRaw !== undefined && Number.isFinite(pageNum) && pageNum > 1;
  const hasNonDefaultSort = Boolean(sort) && sort !== DEFAULT_SORT;
  const hasPriceFilter = Boolean(first(searchParams.minPrice) || first(searchParams.maxPrice));
  const hasOtherParams = Boolean(first(searchParams.tag) || first(searchParams.featured));
  const isNoisy = Boolean(q) || hasNonDefaultSort || isPagedBeyondFirst || hasPriceFilter || hasOtherParams;

  const category = categorySlug ? await prisma.category.findUnique({ where: { slug: categorySlug }, select: { name: true, slug: true } }) : null;

  const baseDescription = "Khám phá marketplace KhangHuynh Vault với các sản phẩm số được tuyển chọn, giá minh bạch và giao hàng tức thì.";

  if (!categorySlug && !isNoisy) {
    return {
      title: "Sản phẩm",
      description: baseDescription,
      alternates: { canonical: `${SITE_URL}/san-pham` },
      openGraph: { title: "Sản phẩm | KhangHuynh Vault", description: "Khám phá marketplace sản phẩm số KhangHuynh Vault.", url: `${SITE_URL}/san-pham`, type: "website" }
    };
  }

  if (categorySlug && category && !isNoisy) {
    const canonical = `${SITE_URL}/san-pham?category=${encodeURIComponent(category.slug)}`;
    return {
      title: `Sản phẩm — ${category.name}`,
      description: `Khám phá sản phẩm số thuộc danh mục ${category.name} tại KhangHuynh Vault.`,
      alternates: { canonical },
      openGraph: { title: `${category.name} | KhangHuynh Vault`, description: `Sản phẩm số thuộc danh mục ${category.name}.`, url: canonical, type: "website" }
    };
  }

  const fallbackCanonical = categorySlug && category ? `${SITE_URL}/san-pham?category=${encodeURIComponent(category.slug)}` : `${SITE_URL}/san-pham`;
  return {
    title: "Sản phẩm",
    description: baseDescription,
    alternates: { canonical: fallbackCanonical },
    robots: { index: false, follow: true }
  };
}

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
