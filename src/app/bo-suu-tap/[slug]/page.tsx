import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { enrichStorefrontProduct } from "@/lib/commerce/enrich-products";
import { isSchemaDriftError } from "@/lib/db/ensure-schema";

export const dynamic = "force-dynamic";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let collection: { name: string; description: string | null } | null = null;
  try {
    collection = await prisma.collection.findUnique({ where: { slug: params.slug }, select: { name: true, description: true } });
  } catch (error) {
    if (!isSchemaDriftError(error)) throw error;
  }
  if (!collection) return { title: "Bộ sưu tập" };
  return {
    title: collection.name,
    description: collection.description ?? `Bộ sưu tập ${collection.name} trên KhangHuynh Vault.`,
    alternates: { canonical: `${SITE_URL}/bo-suu-tap/${params.slug}` }
  };
}

async function loadCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: { category: { select: { name: true, slug: true } } }
          }
        }
      }
    }
  });
}

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  let collection: Awaited<ReturnType<typeof loadCollection>> = null;
  try {
    collection = await loadCollection(params.slug);
  } catch (error) {
    if (!isSchemaDriftError(error)) throw error;
  }
  if (!collection) notFound();

  type CollectionProductRow = (typeof collection.products)[number];
  type PublishedProduct = CollectionProductRow["product"];
  const published = collection.products.map((row: CollectionProductRow) => row.product).filter((product: PublishedProduct) => product.status === "PUBLISHED");
  type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
  const ratings = (await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: published.map((product: PublishedProduct) => product.id) }, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true }
  })) as RatingRow[];
  const ratingMap = new Map<string, { averageRating: number; reviewCount: number }>(
    ratings.map((row: RatingRow) => [row.productId, { averageRating: Number(row._avg.rating ?? 0), reviewCount: row._count._all }])
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <p className="text-eyebrow text-accent-orange">Collection</p>
        <h1 className="mt-2 text-h2 font-display text-white">{collection.name}</h1>
        {collection.description ? <p className="mt-3 max-w-2xl text-small text-white/50">{collection.description}</p> : null}
        <div className="mt-10 grid khv-product-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((product: PublishedProduct) => {
            const enriched = enrichStorefrontProduct(product, ratingMap.get(product.id));
            return (
              <ProductCard
                key={product.id}
                product={{
                  ...enriched,
                  price: Number(product.price),
                  discountPrice: product.discountPrice == null ? null : Number(product.discountPrice),
                  createdAt: product.createdAt.toISOString()
                }}
              />
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
