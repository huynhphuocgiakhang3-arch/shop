import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { EmptyState } from "@/components/dashboard/primitives";
import { isSchemaDriftError } from "@/lib/db/ensure-schema";

export const dynamic = "force-dynamic";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Bộ sưu tập",
  description: "Các bộ sưu tập theo nhu cầu sử dụng trên KhangHuynh Vault.",
  alternates: { canonical: `${SITE_URL}/bo-suu-tap` }
};

export default async function CollectionsPage() {
  let collections: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isFeatured: boolean;
    _count: { products: number };
  }> = [];
  try {
    collections = await prisma.collection.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      include: { _count: { select: { products: true } } }
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) throw error;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <p className="text-eyebrow text-accent-orange">Collections</p>
        <h1 className="mt-2 text-h2 font-display text-white">Bộ sưu tập theo nhu cầu</h1>
        <p className="mt-3 max-w-2xl text-small text-white/50">
          Collection là use-case, khác với danh mục sản phẩm. Chọn một bộ sưu tập để bắt đầu đúng việc bạn đang làm.
        </p>
        {collections.length === 0 ? (
          <div className="mt-10">
            <EmptyState title="Chưa có bộ sưu tập" description="Super Admin có thể tạo collection từ trung tâm điều khiển." actionLabel="Xem Marketplace" actionHref="/san-pham" />
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: (typeof collections)[number]) => (
              <Link
                key={collection.id}
                href={`/bo-suu-tap/${collection.slug}`}
                className="glass-surface khv-interactive rounded-[24px] p-6"
              >
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
                  {collection.isFeatured ? "Featured" : "Collection"}
                </p>
                <h2 className="mt-2 text-title text-white">{collection.name}</h2>
                {collection.description ? <p className="mt-2 line-clamp-2 text-small text-white/45">{collection.description}</p> : null}
                <p className="mt-4 text-caption text-white/35">{collection._count.products} sản phẩm</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
