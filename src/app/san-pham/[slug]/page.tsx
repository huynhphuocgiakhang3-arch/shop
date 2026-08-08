"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Heart, ShoppingCart, Download, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useCurrentUser } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading } = useProduct(params.slug);
  const { data: userData } = useCurrentUser();
  const addToCart = useAddToCart();
  const toggleFavorite = useToggleFavorite();
  const { show } = useToast();
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <LoadingBlock />;
  if (!data) return null;

  const { product, related, isFavorited, hasPurchased } = data;
  const images = [product.thumbnailUrl, ...(product.galleryUrls ?? [])];
  const discountValue =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.price)
      ? Number(product.discountPrice)
      : null;
  const hasDiscount = discountValue !== null;
  const displayPrice = discountValue ?? product.price;

  const requireLogin = () => {
    show("Vui lòng đăng nhập để tiếp tục.", "info");
    router.push("/dang-nhap");
  };

  const handleAddToCart = () => {
    if (!userData?.user) return requireLogin();
    addToCart.mutate(
      { productId: product.id },
      {
        onSuccess: () => show("Đã thêm vào giỏ hàng.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể thêm vào giỏ hàng.", "error")
      }
    );
  };

  const handleToggleFavorite = () => {
    if (!userData?.user) return requireLogin();
    toggleFavorite.mutate(product.id, {
      onSuccess: (res) => show(res.isFavorited ? "Đã thêm vào yêu thích." : "Đã bỏ yêu thích.", "success")
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white/5">
              <Image src={images[activeImage] ?? product.thumbnailUrl} alt={product.name} fill className="object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-md border",
                      i === activeImage ? "border-accent-orange" : "border-white/10"
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category && <span className="text-caption uppercase tracking-wide text-white/40">{product.category.name}</span>}
            <h1 className="mt-1 text-h2 font-display text-white">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.averageRating) ? "fill-accent-orange text-accent-orange" : "text-white/15")} />
              ))}
              <span className="text-caption text-white/40">({product.reviews.length} đánh giá)</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className={cn("text-h2 font-display", hasDiscount ? "text-accent-orange" : "text-white")}>
                {formatVnd(displayPrice)}
              </span>
              {hasDiscount && <span className="text-title text-white/35 line-through">{formatVnd(product.price)}</span>}
            </div>

            <p className="mt-5 text-small text-white/60">{product.shortDescription}</p>

            <div className="mt-6 flex gap-3">
              {hasPurchased ? (
                <Button onClick={() => router.push("/tai-xuong")}>
                  <Download className="h-4 w-4" /> Đã sở hữu — Tải xuống
                </Button>
              ) : (
                <Button onClick={handleAddToCart} isLoading={addToCart.isPending}>
                  <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ hàng
                </Button>
              )}
              <Button variant="secondary" onClick={handleToggleFavorite}>
                <Heart className={cn("h-4 w-4", isFavorited && "fill-accent-orange text-accent-orange")} />
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-caption text-white/35">
              <ShieldCheck className="h-3.5 w-3.5" /> Giao hàng số tức thì sau khi thanh toán
            </div>

            <GlassPanel radius="md" className="mt-6 grid grid-cols-2 gap-4 p-5 text-small">
              <div>
                <p className="text-caption text-white/35">Phiên bản</p>
                <p className="text-white/80">{product.version}</p>
              </div>
              {product.compatibility && (
                <div>
                  <p className="text-caption text-white/35">Tương thích</p>
                  <p className="text-white/80">{product.compatibility}</p>
                </div>
              )}
            </GlassPanel>
          </div>
        </div>

        <GlassPanel radius="md" className="mt-10 p-6">
          <h2 className="mb-3 text-title text-white">Mô tả sản phẩm</h2>
          <p className="whitespace-pre-wrap text-small text-white/60">{product.description}</p>
        </GlassPanel>

        <div className="mt-10">
          <h2 className="mb-4 text-title text-white">Đánh giá ({product.reviews.length})</h2>
          {product.reviews.length === 0 ? (
            <p className="text-small text-white/40">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {product.reviews.map((r) => (
                <GlassPanel key={r.id} radius="md" className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-accent-orange text-accent-orange" : "text-white/15")} />
                      ))}
                    </div>
                    <span className="text-caption text-white/30">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-small text-white/70">{r.comment}</p>}
                  <p className="mt-2 text-caption text-white/40">
                    {r.user.displayName} {r.isVerified && <span className="text-state-success">· Đã mua hàng</span>}
                  </p>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-6 text-h3 font-display text-white">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
