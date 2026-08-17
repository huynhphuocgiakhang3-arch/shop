"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Bán chạy nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" }
];

// "newest" is the server's own default (see SORT_OPTIONS.newest in
// api/products/route.ts) — keeping it out of the URL when selected avoids
// /san-pham?sort=newest and /san-pham representing the exact same state as
// two different indexable-looking URLs (Phase 3B normalization rule).
const DEFAULT_SORT = "newest";
const SEARCH_DEBOUNCE_MS = 400;

// Builds the next URL for this page from the *current* URLSearchParams plus
// a patch. `null`/`undefined`/`""` deletes a key. Also strips default-value
// params (sort=newest, page=1) so we never emit two URLs for one state.
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

// Static shell shown while the Suspense boundary above resolves — mirrors
// the real layout's structural chrome (header/footer + a loading block)
// so there's no visible flash/reflow once useSearchParams() resolves.
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

  // Filter/sort/page state lives in the URL — this component only derives
  // from it, so a refresh, a shared link, or the browser Back/Forward
  // buttons all reproduce the exact same listing deterministically.
  const urlQ = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? undefined;
  const sort = searchParams.get("sort") ?? DEFAULT_SORT;

  const rawPage = Number(searchParams.get("page"));
  const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : 1;

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({ q: urlQ || undefined, category, sort, page });

  // A pending debounce timer can outlive a same-tick navigation triggered by
  // clicking a category/sort control (see the effect below) — this ref
  // always holds the latest router/pathname/searchParams so the timer reads
  // fresh values at fire-time instead of a stale render-time closure that
  // could clobber a navigation that happened while it was waiting.
  const latestRef = useRef({ router, pathname, searchParams });
  useEffect(() => {
    latestRef.current = { router, pathname, searchParams };
  });

  // Local text state exists only so typing feels instant; the URL (and the
  // actual API call, via useProducts above) only updates after the person
  // pauses for SEARCH_DEBOUNCE_MS, so a burst of keystrokes fires one
  // request instead of one per character.
  const [searchInput, setSearchInput] = useState(urlQ);

  // If the URL's ?q changes from *outside* this component's own debounce
  // commit — Back/Forward navigation, or the "Xóa bộ lọc" action — keep the
  // visible input in sync with it.
  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (searchInput === urlQ) return;
    const handle = setTimeout(() => {
      const { router: r, pathname: p, searchParams: sp } = latestRef.current;
      r.replace(buildUrl(p, sp, { q: searchInput || null, page: null }), { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // Only re-run when the debounced value itself changes — pathname/
    // searchParams/router are read fresh from latestRef at fire-time above,
    // so they're deliberately excluded here (see latestRef comment).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, urlQ]);

  // Category and sort are discrete choices (not continuous typing), so each
  // click is a real navigation the person would expect Back to step through.
  const selectCategory = useCallback(
    (slug: string | undefined) => {
      router.push(buildUrl(pathname, searchParams, { category: slug ?? null, page: null }), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const selectSort = useCallback(
    (value: string) => {
      router.push(buildUrl(pathname, searchParams, { sort: value === DEFAULT_SORT ? null : value, page: null }), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const hasActiveFilters = Boolean(urlQ || category || sort !== DEFAULT_SORT || page > 1);

  const clearFiltersHref = "/san-pham";

  const paginationHrefs = useMemo(() => {
    if (!data || data.pagination.totalPages <= 1) return [];
    return Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => ({
      page: p,
      href: buildUrl(pathname, searchParams, { page: p === 1 ? null : p })
    }));
  }, [data, pathname, searchParams]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-h2 font-display text-white">Marketplace</h1>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
              className="khv-touch-target w-full bg-transparent text-small text-white placeholder:text-white/30 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Xóa từ khóa tìm kiếm"
                className="khv-touch-target flex shrink-0 items-center justify-center text-white/40 hover:text-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => selectSort(e.target.value)}
            aria-label="Sắp xếp theo"
            className="khv-touch-target rounded-pill border border-white/10 bg-bg-secondary px-4 py-2.5 text-small text-white/80 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Lọc theo danh mục">
          <button
            type="button"
            onClick={() => selectCategory(undefined)}
            aria-pressed={!category}
            className={cn(
              "khv-touch-target rounded-pill border px-4 py-1.5 text-small transition-colors",
              !category ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            Tất cả
          </button>
          {(categoriesData?.categories ?? []).map((c) => (
            <button
              type="button"
              key={c.slug}
              onClick={() => selectCategory(c.slug)}
              aria-pressed={category === c.slug}
              className={cn(
                "khv-touch-target rounded-pill border px-4 py-1.5 text-small transition-colors",
                category === c.slug ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
              )}
            >
              {c.name}
            </button>
          ))}
          {hasActiveFilters && (
            <Link
              href={clearFiltersHref}
              className="khv-touch-target ml-auto inline-flex items-center gap-1.5 rounded-pill border border-white/10 px-4 py-1.5 text-small text-white/45 transition-colors hover:text-white/80"
            >
              <X className="h-3.5 w-3.5" /> Xóa bộ lọc
            </Link>
          )}
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Hãy thử từ khóa hoặc bộ lọc khác."
            actionLabel={hasActiveFilters ? "Xóa bộ lọc" : undefined}
            actionHref={hasActiveFilters ? clearFiltersHref : undefined}
          />
        ) : (
          <>
            <p className="mb-4 text-caption text-white/35">{data.pagination.total} sản phẩm</p>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>

            {paginationHrefs.length > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
                {paginationHrefs.map(({ page: p, href }) => (
                  <Link
                    key={p}
                    href={href}
                    scroll={false}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "khv-touch-target flex items-center justify-center rounded-full text-small transition-colors",
                      p === page ? "bg-accent-orange text-black" : "text-white/50 hover:bg-white/5"
                    )}
                  >
                    {p}
                  </Link>
                ))}
              </nav>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
