import Link from "next/link";
import { ArrowUpRight, Package, Sparkles } from "lucide-react";
import { RevealSection } from "./RevealSection";

export interface CategoryCardData { slug: string; name: string; icon?: string | null; _count: { products: number } }

export function CategoriesGrid({ categories }: { categories: CategoryCardData[] }) {
  if (!categories.length) return null;
  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-20">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Explore</p><h2 className="text-h2 font-display font-semibold tracking-[-.035em] text-white">Khám phá theo không gian</h2><p className="mt-2 max-w-xl text-small text-white/40">Mỗi danh mục là một lối vào khác nhau trong hệ sinh thái Vault.</p></div>
        <Link href="/danh-muc" className="hidden items-center gap-2 text-xs font-semibold text-white/45 transition hover:text-white sm:flex">Tất cả danh mục <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link key={category.slug} href={`/san-pham?category=${category.slug}`} className="khv-category-card group glass-surface relative overflow-hidden rounded-lg p-5 sm:p-6">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent-orange/10 blur-2xl transition duration-500 group-hover:bg-accent-orange/20" />
            <div className="relative flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-orange/15 bg-accent-orange/[.07] text-accent-orange transition duration-500 group-hover:scale-110 group-hover:rotate-3"><Package className="h-5 w-5" /></span><span className="text-[10px] font-bold tracking-[.16em] text-white/20">0{index + 1}</span></div>
            <div className="relative mt-8"><p className="text-[15px] font-semibold text-white/85 group-hover:text-white">{category.name}</p><div className="mt-2 flex items-center justify-between"><span className="text-[11px] text-white/35">{category._count.products} sản phẩm</span><ArrowUpRight className="h-4 w-4 text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-orange" /></div></div>
            <div className="relative mt-4 h-px overflow-hidden bg-white/[.06]"><div className="h-full w-1/3 bg-gradient-to-r from-accent-orange to-accent-blue transition-all duration-500 group-hover:w-full" /></div>
          </Link>
        ))}
      </div>
      <Link href="/danh-muc" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/[.08] bg-white/[.025] px-4 py-3 text-xs font-semibold text-white/55 sm:hidden">Xem tất cả danh mục <Sparkles className="h-3.5 w-3.5 text-accent-orange" /></Link>
    </RevealSection>
  );
}
