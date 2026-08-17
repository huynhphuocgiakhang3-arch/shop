import { ProductCard, type ProductCardData } from "./ProductCard";
import { RevealSection } from "./RevealSection";

export function ProductGridSection({
  title,
  subtitle,
  products
}: {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-20">
      <div className="mb-9 flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3"><span className="h-7 w-1 rounded-full bg-gradient-to-b from-accent-orange to-accent-orange-deep"/><h2 className="text-h2 font-display font-semibold tracking-[-.025em] text-white">{title}</h2></div>
          {subtitle && <p className="mt-1 text-small text-white/50">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </RevealSection>
  );
}
