"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useFavorites, useToggleFavorite, type FavoriteItem } from "@/hooks/useFavorites";
import { useAddToCart } from "@/hooks/useCart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "priceAsc" | "priceDesc" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mới thêm" },
  { key: "priceAsc", label: "Giá thấp → cao" },
  { key: "priceDesc", label: "Giá cao → thấp" },
  { key: "name", label: "Tên A-Z" }
];

function effectivePrice(fav: FavoriteItem) {
  const price = Number(fav.product.price);
  const discount = fav.product.discountPrice != null ? Number(fav.product.discountPrice) : null;
  return discount != null && discount < price ? discount : price;
}

export default function FavoritesPage() {
  const { data, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const addToCart = useAddToCart();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [addingAll, setAddingAll] = useState(false);

  const favorites = useMemo(() => data?.favorites ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? favorites.filter((f) => f.product.name.toLowerCase().includes(q)) : [...favorites];
    switch (sort) {
      case "priceAsc":
        return list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case "priceDesc":
        return list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case "name":
        return list.sort((a, b) => a.product.name.localeCompare(b.product.name, "vi"));
      case "recent":
      default:
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [favorites, query, sort]);

  const handleAddAll = async () => {
    if (favorites.length === 0) return;
    setAddingAll(true);
    try {
      for (const fav of favorites) {
        await addToCart.mutateAsync({ productId: fav.product.id });
      }
      show(`Đã thêm ${favorites.length} sản phẩm vào giỏ hàng.`, "success");
    } catch {
      show("Một số sản phẩm không thể thêm vào giỏ. Vui lòng thử lại.", "error");
    } finally {
      setAddingAll(false);
    }
  };

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-display text-white">Sản phẩm yêu thích</h1>
          <p className="mt-1 text-small text-white/50">{favorites.length} sản phẩm đang chờ trong danh sách của bạn.</p>
        </div>
        {favorites.length > 1 && (
          <Button className="khv-touch-target" onClick={handleAddAll} isLoading={addingAll}>
            <ShoppingCart className="h-4 w-4" /> Thêm tất cả vào giỏ
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm yêu thích"
          description="Nhấn biểu tượng trái tim trên sản phẩm để lưu vào đây."
          actionLabel="Khám phá sản phẩm"
          actionHref="/san-pham"
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm trong danh sách yêu thích..."
                className="w-full rounded-2xl border border-white/10 bg-white/[.03] py-2.5 pl-10 pr-4 text-small text-white outline-none focus:border-accent-orange/50"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-white/30" />
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-caption font-medium transition-colors",
                    sort === s.key ? "bg-accent-orange/15 text-accent-orange" : "bg-white/[.04] text-white/50 hover:bg-white/[.08]"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Không tìm thấy sản phẩm" description={`Không có kết quả nào khớp với "${query}".`} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((fav) => {
                const price = Number(fav.product.price);
                const discount = fav.product.discountPrice != null ? Number(fav.product.discountPrice) : null;
                const hasDiscount = discount != null && discount < price;

                return (
                  <GlassPanel key={fav.id} radius="md" className="group overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      <Link href={`/san-pham/${fav.product.slug}`} className="absolute inset-0">
                        <Image
                          src={fav.product.thumbnailUrl}
                          alt={fav.product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      {hasDiscount && (
                        <span className="absolute left-2 top-2 rounded-full border border-state-success/30 bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-state-success backdrop-blur-xl">
                          Ưu đãi
                        </span>
                      )}
                      <button
                        onClick={() =>
                          toggleFavorite.mutate(fav.product.id, {
                            onSuccess: () => show("Đã bỏ khỏi yêu thích.", "info")
                          })
                        }
                        className="khv-touch-target absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-accent-orange backdrop-blur"
                        aria-label="Bỏ yêu thích"
                      >
                        <Heart className="h-4 w-4 fill-accent-orange" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 p-3">
                      <Link href={`/san-pham/${fav.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                        {fav.product.name}
                      </Link>
                      <div className="flex items-baseline gap-1.5">
                        <p className={cn("text-small font-semibold", hasDiscount ? "text-accent-orange" : "text-white")}>
                          {formatVnd(hasDiscount ? discount! : price)}
                        </p>
                        {hasDiscount && <p className="text-[11px] text-white/30 line-through">{formatVnd(price)}</p>}
                      </div>
                      <Button
                        variant="secondary"
                        className="khv-touch-target mt-1 w-full py-1.5 text-caption"
                        onClick={() =>
                          addToCart.mutate(
                            { productId: fav.product.id },
                            { onSuccess: () => show("Đã thêm vào giỏ hàng.", "success") }
                          )
                        }
                        isLoading={addToCart.isPending && addToCart.variables?.productId === fav.product.id}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Thêm vào giỏ
                      </Button>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
