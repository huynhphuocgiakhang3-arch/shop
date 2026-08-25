import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isSchemaDriftError } from "@/lib/db/ensure-schema";

export async function CollectionsStrip() {
  let collections: Array<{ id: string; name: string; slug: string; _count: { products: number } }> = [];
  try {
    collections = await prisma.collection.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      take: 4,
      include: { _count: { select: { products: true } } }
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) throw error;
    return null;
  }
  if (collections.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1380px] px-4 py-12 sm:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-eyebrow text-accent-orange">Collections</p>
          <h2 className="mt-2 text-h2 font-display text-white">Chọn theo nhu cầu</h2>
        </div>
        <Link href="/bo-suu-tap" className="text-small text-accent-orange">Xem tất cả</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection: (typeof collections)[number]) => (
          <Link key={collection.id} href={`/bo-suu-tap/${collection.slug}`} className="glass-surface khv-interactive rounded-[24px] p-5">
            <h3 className="text-title text-white">{collection.name}</h3>
            <p className="mt-2 text-caption text-white/40">{collection._count.products} sản phẩm</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
