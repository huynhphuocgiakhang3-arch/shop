"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { ProductCardData } from "./ProductCard";
import { RevealSection } from "./RevealSection";
import { recentlyViewedSlugs } from "@/lib/commerce/recently-viewed";
import { SafeImage } from "@/components/ui/SafeImage";

export function RecentlyViewedSection({ products }: { products: ProductCardData[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    setSlugs(recentlyViewedSlugs(6));
  }, []);
  const items = slugs.map((slug) => products.find((product) => product.slug === slug)).filter(Boolean).slice(0, 4) as ProductCardData[];
  if (!items.length) return null;
  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-12 sm:px-8 lg:py-16">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Continue exploring</p><h2 className="text-h2 font-display font-semibold tracking-[-.035em] text-white">Bạn đã xem</h2></div>
        <Clock3 className="hidden h-5 w-5 text-white/20 sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <Link key={product.slug} href={`/san-pham/${product.slug}`} className="group glass-surface overflow-hidden rounded-[22px] border-white/[.08] p-2 transition duration-300 hover:-translate-y-1 hover:border-accent-orange/25">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[17px] bg-white/[.03]">
              <SafeImage src={product.thumbnailUrl} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 260px" className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white/85">{product.name}</p><p className="mt-1 text-xs text-accent-orange">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(product.discountPrice ?? product.price))}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-accent-orange" /></div>
          </Link>
        ))}
      </div>
    </RevealSection>
  );
}
