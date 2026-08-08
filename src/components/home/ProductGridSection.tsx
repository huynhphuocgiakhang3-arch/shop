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
    <RevealSection className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-h2 font-display text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-small text-white/50">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </RevealSection>
  );
}
