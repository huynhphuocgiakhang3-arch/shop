"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";

export default function FavoritesPage() {
  const { data, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { show } = useToast();

  if (isLoading) return <LoadingBlock />;

  const favorites = data?.favorites ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Sản phẩm yêu thích</h1>

      {favorites.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm yêu thích"
          description="Nhấn biểu tượng trái tim trên sản phẩm để lưu vào đây."
          actionLabel="Khám phá sản phẩm"
          actionHref="/san-pham"
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((fav) => (
            <GlassPanel key={fav.id} radius="md" className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={fav.product.thumbnailUrl} alt={fav.product.name} fill className="object-cover" />
                <button
                  onClick={() =>
                    toggleFavorite.mutate(fav.product.id, {
                      onSuccess: () => show("Đã bỏ khỏi yêu thích.", "info")
                    })
                  }
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-accent-orange backdrop-blur"
                  aria-label="Bỏ yêu thích"
                >
                  <Heart className="h-4 w-4 fill-accent-orange" />
                </button>
              </div>
              <div className="p-3">
                <Link href={`/san-pham/${fav.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                  {fav.product.name}
                </Link>
                <p className="mt-1 text-small font-semibold text-accent-orange">
                  {formatVnd(fav.product.discountPrice ?? fav.product.price)}
                </p>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
