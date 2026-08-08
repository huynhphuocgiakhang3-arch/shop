import Link from "next/link";
import { Package } from "lucide-react";
import { RevealSection } from "./RevealSection";

export interface CategoryCardData {
  slug: string;
  name: string;
  icon?: string | null;
  _count: { products: number };
}

export function CategoriesGrid({ categories }: { categories: CategoryCardData[] }) {
  if (categories.length === 0) return null;

  return (
    <RevealSection className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8">
      <h2 className="mb-8 text-h2 font-display text-white">Danh mục nổi bật</h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/san-pham?category=${category.slug}`}
            className="glass-surface group flex flex-col items-center gap-3 rounded-md px-4 py-8 text-center transition-transform duration-standard hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-orange/10 text-accent-orange transition-transform group-hover:scale-110">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-title text-white">{category.name}</span>
            <span className="text-caption text-white/40">{category._count.products} sản phẩm</span>
          </Link>
        ))}
      </div>
    </RevealSection>
  );
}
