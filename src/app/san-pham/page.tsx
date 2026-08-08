"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({ q: q || undefined, category, sort, page });

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-h2 font-display text-white">Marketplace</h1>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full bg-transparent text-small text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-pill border border-white/10 bg-bg-secondary px-4 py-2.5 text-small text-white/80 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategory(undefined);
              setPage(1);
            }}
            className={cn(
              "rounded-pill border px-4 py-1.5 text-small transition-colors",
              !category ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            Tất cả
          </button>
          {(categoriesData?.categories ?? []).map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
              className={cn(
                "rounded-pill border px-4 py-1.5 text-small transition-colors",
                category === c.slug ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Không tìm thấy sản phẩm" description="Hãy thử từ khóa hoặc bộ lọc khác." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-9 w-9 rounded-full text-small transition-colors",
                      p === page ? "bg-accent-orange text-black" : "text-white/50 hover:bg-white/5"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
