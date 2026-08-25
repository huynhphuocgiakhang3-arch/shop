"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "popular", label: "Phổ biến" },
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" }
];

const DEFAULT_SORT = "newest";
const SEARCH_DEBOUNCE_MS = 400;

function buildUrl(pathname: string, current: URLSearchParams, patch: Record<string, string | number | null | undefined>) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (next.get("sort") === DEFAULT_SORT) next.delete("sort");
  if (next.get("page") === "1") next.delete("page");
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function MarketplaceClient() {
  return (
    <Suspense fallback={<MarketplacePageFallback />}>
      <MarketplacePageInner />
    </Suspense>
  );
}

function MarketplacePageFallback() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-h2 font-display text-white">Marketplace</h1>
        <LoadingBlock />
      </main>
      <SiteFooter />
    </div>
  );
}

function MarketplacePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const urlQ = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? undefined;
  const sort = searchParams.get("sort") ?? DEFAULT_SORT;
  const featured = searchParams.get("featured") === "true";
  const bestseller = searchParams.get("bestseller") === "true";
  const isNew = searchParams.get("new") === "true";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : 1;

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({
    q: urlQ || undefined,
    category,
    sort,
    page,
    featured: featured || undefined,
    bestseller: bestseller || undefined,
    isNew: isNew || undefined,
    minPrice,
    maxPrice,
    minRating
  });

  const latestRef = useRef({ router, pathname, searchParams });
  useEffect(() => {
    latestRef.current = { router, pathname, searchParams };
  });

  const [searchInput, setSearchInput] = useState(urlQ);
  useEffect(() => setSearchInput(urlQ), [urlQ]);

  useEffect(() => {
    if (searchInput === urlQ) return;
    const handle = setTimeout(() => {
      const { router: r, pathname: p, searchParams: sp } = latestRef.current;
      r.replace(buildUrl(p, sp, { q: searchInput || null, page: null }), { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, urlQ]);

  const patch = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      router.push(buildUrl(pathname, searchParams, { ...next, page: null }), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const hasActiveFilters = Boolean(urlQ || category || sort !== DEFAULT_SORT || page > 1 || featured || bestseller || isNew || minPrice || maxPrice || minRating);

  const paginationHrefs = useMemo(() => {
    if (!data || data.pagination.totalPages <= 1) return [];
    return Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => ({
      page: p,
      href: buildUrl(pathname, searchParams, { page: p === 1 ? null : p })
    }));
  }, [data, pathname, searchParams]);

  const filters = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/35">Danh mục</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => patch({ category: null })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", !category ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>Tất cả</button>
          {(categoriesData?.categories ?? []).map((c) => (
            <button key={c.slug} type="button" onClick={() => patch({ category: c.slug })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", category === c.slug ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>{c.name}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/35">Giá</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min={0} placeholder="Từ" defaultValue={minPrice ?? ""} onBlur={(e) => patch({ minPrice: e.target.value || null })} className="khv-touch-target rounded-2xl border border-white/10 bg-white/[.03] px-3 text-small text-white" />
          <input type="number" min={0} placeholder="Đến" defaultValue={maxPrice ?? ""} onBlur={(e) => patch({ maxPrice: e.target.value || null })} className="khv-touch-target rounded-2xl border border-white/10 bg-white/[.03] px-3 text-small text-white" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/35">Đánh giá</p>
        <div className="flex flex-wrap gap-2">
          {[undefined, 4, 5].map((value) => (
            <button key={String(value)} type="button" onClick={() => patch({ minRating: value ?? null })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", minRating === value || (!minRating && !value) ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>
              {value ? `${value}+ sao` : "Tất cả"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => patch({ featured: featured ? null : "true" })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", featured ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>Nổi bật</button>
        <button type="button" onClick={() => patch({ bestseller: bestseller ? null : "true" })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", bestseller ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>Bán chạy</button>
        <button type="button" onClick={() => patch({ new: isNew ? null : "true" })} className={cn("khv-touch-target rounded-full border px-3 py-1.5 text-small", isNew ? "border-accent-orange/60 text-accent-orange" : "border-white/10 text-white/50")}>Mới</button>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-small text-white/35">Giao hàng tức thì</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-h2 font-display text-white">Marketplace</h1>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm kiếm sản phẩm..." aria-label="Tìm kiếm sản phẩm" className="khv-touch-target w-full bg-transparent text-small text-white placeholder:text-white/30 focus:outline-none" />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput("")} aria-label="Xóa từ khóa tìm kiếm" className="khv-touch-target flex shrink-0 items-center justify-center text-white/40 hover:text-white/80">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={sort} onChange={(e) => patch({ sort: e.target.value === DEFAULT_SORT ? null : e.target.value })} aria-label="Sắp xếp theo" className="khv-touch-target rounded-pill border border-white/10 bg-bg-secondary px-4 py-2.5 text-small text-white/80 focus:outline-none">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" onClick={() => setFiltersOpen(true)} className="khv-touch-target inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-small text-white/70 lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">{filters}</aside>
          <div>
            {hasActiveFilters && (
              <Link href="/san-pham" className="mb-4 inline-flex items-center gap-1.5 text-small text-white/40 hover:text-white">
                <X className="h-3.5 w-3.5" /> Xóa bộ lọc
              </Link>
            )}
            {isLoading ? (
              <LoadingBlock />
            ) : !data || data.items.length === 0 ? (
              <EmptyState title="Không tìm thấy sản phẩm" description="Hãy thử từ khóa hoặc bộ lọc khác." actionLabel={hasActiveFilters ? "Xóa bộ lọc" : undefined} actionHref={hasActiveFilters ? "/san-pham" : undefined} />
            ) : (
              <>
                <p className="mb-4 text-caption text-white/35">{data.pagination.total} sản phẩm</p>
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((product) => <ProductCard key={product.slug} product={product} />)}
                </div>
                {paginationHrefs.length > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
                    {paginationHrefs.map(({ page: p, href }) => (
                      <Link key={p} href={href} scroll={false} aria-current={p === page ? "page" : undefined} className={cn("khv-touch-target flex items-center justify-center rounded-full text-small", p === page ? "bg-accent-orange text-black" : "text-white/50 hover:bg-white/5")}>{p}</Link>
                    ))}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <BottomSheet open={filtersOpen} title="Bộ lọc" onClose={() => setFiltersOpen(false)}>
        {filters}
      </BottomSheet>
      <SiteFooter />
    </div>
  );
}
