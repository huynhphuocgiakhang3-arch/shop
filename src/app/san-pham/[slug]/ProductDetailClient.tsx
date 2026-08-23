"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Heart, ShoppingCart, Download, ShieldCheck, ChevronLeft, PencilLine } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/home/ProductCard";
import { useProduct, useCreateReview, type ProductDetailResponse } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useCurrentUser } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Everything server-renderable (title, price, description, reviews, JSON-LD)
// already lives in the parent Server Component for SEO. This component only
// owns interactive state — gallery selection, cart, favorites — and is
// hydrated instantly from `initialData` with zero extra network round trip.
export function ProductDetailClient({ slug, initialData }: { slug: string; initialData: ProductDetailResponse }) {
  const router = useRouter();
  const { data } = useProduct(slug, initialData);
  const { data: userData } = useCurrentUser();
  const addToCart = useAddToCart();
  const toggleFavorite = useToggleFavorite();
  const { show } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [justReviewed, setJustReviewed] = useState(false);

  const payload = data ?? initialData;
  const { product, related, isFavorited, hasPurchased } = payload;
  const images = [product.thumbnailUrl, ...(product.galleryUrls ?? [])];
  const discountValue =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.price) ? Number(product.discountPrice) : null;
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

  const handleBuyNow = () => {
    if (!userData?.user) return requireLogin();
    addToCart.mutate(
      { productId: product.id },
      {
        onSuccess: () => router.push("/thanh-toan"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể bắt đầu mua.", "error")
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
    <>
      <nav className="mb-6 flex items-center gap-1 text-caption text-white/35 sm:mb-8">
        <Link href="/san-pham" className="khv-touch-target -ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:text-white/70">
          <ChevronLeft className="h-3.5 w-3.5" /> Marketplace
        </Link>
        {product.category && (
          <>
            <span className="opacity-40">/</span>
            <span className="truncate text-white/50">{product.category.name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/[.08] bg-white/[.025] shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:rounded-[28px]">
            <Image
              src={images[activeImage] ?? product.thumbnailUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            {hasDiscount && (
              <span className="absolute left-3 top-3 rounded-full border border-state-success/30 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-state-success backdrop-blur-xl sm:left-4 sm:top-4">
                Ưu đãi
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="khv-thumb-rail mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Ảnh ${i + 1}`}
                  className={cn(
                    "relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl border transition-colors sm:h-20 sm:w-20",
                    i === activeImage ? "border-accent-orange" : "border-white/10 hover:border-white/25"
                  )}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="khv-hero-title text-[26px] font-semibold leading-tight tracking-[-.02em] text-white sm:text-h2">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.averageRating) ? "fill-accent-orange text-accent-orange" : "text-white/15")} />
              ))}
            </div>
            <span className="text-caption text-white/40">
              {product.averageRating > 0 ? product.averageRating.toFixed(1) : "Chưa có"} · {product.reviews.length} đánh giá
            </span>
            {typeof product.salesCount === "number" && product.salesCount > 0 && (
              <span className="text-caption text-white/30">· {product.salesCount} đã bán</span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className={cn("text-[32px] font-bold tracking-tight sm:text-h2", hasDiscount ? "text-accent-orange" : "text-white")}>
              {formatVnd(displayPrice)}
            </span>
            {hasDiscount && <span className="text-title text-white/35 line-through">{formatVnd(product.price)}</span>}
          </div>

          <p className="mt-5 text-small leading-6 text-white/60">{product.shortDescription}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {hasPurchased ? (
              <Button className="khv-touch-target" onClick={() => router.push("/tai-xuong")}>
                <Download className="h-4 w-4" /> Đã sở hữu — Tải xuống
              </Button>
            ) : (
              <>
                <Button className="khv-touch-target" onClick={handleBuyNow} isLoading={addToCart.isPending}>
                  Mua ngay
                </Button>
                <Button className="khv-touch-target" variant="secondary" onClick={handleAddToCart} isLoading={addToCart.isPending}>
                  <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ hàng
                </Button>
              </>
            )}
            <Button className="khv-touch-target" variant="secondary" onClick={handleToggleFavorite} aria-label="Yêu thích">
              <Heart className={cn("h-4 w-4", isFavorited && "fill-accent-orange text-accent-orange")} />
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-caption text-white/35">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Giao hàng số tức thì sau khi thanh toán
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

      <GlassPanel radius="md" className="mt-10 p-5 sm:p-6">
        <h2 className="mb-3 text-title text-white">Mô tả sản phẩm</h2>
        <p className="whitespace-pre-wrap text-small leading-7 text-white/60">{product.description}</p>
      </GlassPanel>

      <div className="mt-10">
        <h2 className="mb-4 text-title text-white">Đánh giá ({product.reviews.length})</h2>

        {/* The write-review API has existed since before this session but had
            no UI anywhere to call it — purchasers could see reviews but
            never leave one. `hasPurchased` gates eligibility; if someone
            already reviewed in a past session the API's own duplicate check
            (409) catches it and we just surface that message, rather than
            trying to match reviewer identity client-side (the reviews list
            only carries a display name, not a user id, so that match would
            be unreliable anyway). */}
        {hasPurchased && !justReviewed && <ReviewForm slug={slug} onSubmitted={() => setJustReviewed(true)} />}
        {justReviewed && (
          <GlassPanel radius="md" className="mb-4 flex items-center gap-2.5 p-4">
            <Star className="h-4 w-4 shrink-0 fill-accent-orange text-accent-orange" />
            <p className="text-small text-white/70">Cảm ơn bạn đã đánh giá sản phẩm!</p>
          </GlassPanel>
        )}

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
          <div className="grid khv-product-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ReviewForm({ slug, onSubmitted }: { slug: string; onSubmitted: () => void }) {
  const createReview = useCreateReview(slug);
  const { show } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating < 1) {
      show("Vui lòng chọn số sao đánh giá.", "info");
      return;
    }
    createReview.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          show("Đã gửi đánh giá của bạn.", "success");
          onSubmitted();
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể gửi đánh giá. Vui lòng thử lại.", "error")
      }
    );
  };

  return (
    <GlassPanel radius="md" className="mb-4 flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <PencilLine className="h-4 w-4 text-accent-orange" />
        <p className="text-small font-semibold text-white/85">Bạn đã mua sản phẩm này — chia sẻ đánh giá nhé</p>
      </div>

      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Chọn số sao đánh giá">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const filled = value <= (hoverRating || rating);
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} sao`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="khv-touch-target flex h-9 w-9 items-center justify-center"
            >
              <Star className={cn("h-6 w-6 transition-colors", filled ? "fill-accent-orange text-accent-orange" : "text-white/20")} />
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Cảm nhận của bạn về sản phẩm (không bắt buộc)..."
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[.03] p-3 text-small text-white outline-none placeholder:text-white/30 focus:border-accent-orange/50"
      />

      <Button className="khv-touch-target w-fit" onClick={handleSubmit} isLoading={createReview.isPending}>
        Gửi đánh giá
      </Button>
    </GlassPanel>
  );
}
