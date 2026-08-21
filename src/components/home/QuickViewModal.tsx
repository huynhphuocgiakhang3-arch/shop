"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, Star, ShoppingCart, ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function formatVnd(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value));
}

/**
 * Inline product preview — opened from a grid card ("Xem nhanh") so people
 * can check price, description, and reviews without leaving the page
 * they're browsing (Vault, marketplace grid, favorites, etc.). Reuses the
 * exact same `useProduct` hook as the full detail page, so there's no new
 * API surface to maintain and the data is always consistent with it.
 */
export function QuickViewModal({ slug, open, onClose }: { slug: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { data, isLoading } = useProduct(slug);
  const { data: userData } = useCurrentUser();
  const addToCart = useAddToCart();
  const { show } = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const product = data?.product;
  const discountValue =
    product && product.discountPrice != null && Number(product.discountPrice) < Number(product.price) ? Number(product.discountPrice) : null;
  const hasDiscount = discountValue !== null;
  const displayPrice = product ? (discountValue ?? product.price) : 0;

  const requireLogin = () => {
    show("Vui lòng đăng nhập để tiếp tục.", "info");
    router.push("/dang-nhap");
  };

  const handleAddToCart = () => {
    if (!product) return;
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
    if (!product) return;
    if (!userData?.user) return requireLogin();
    addToCart.mutate(
      { productId: product.id },
      {
        onSuccess: () => router.push("/thanh-toan"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể bắt đầu mua.", "error")
      }
    );
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/78 p-3 backdrop-blur-md sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto flex w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] py-0 sm:max-h-[min(92dvh,820px)]"
          >
            <GlassPanel radius="md" className="max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain p-0 sm:max-h-[min(92dvh,820px)]">
              <button
                onClick={onClose}
                className="khv-touch-target absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-xl hover:text-white"
                aria-label="Đóng xem nhanh"
              >
                <X className="h-4 w-4" />
              </button>

              {isLoading || !product ? (
                <div className="flex h-[420px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[380px]">
                    <Image src={product.thumbnailUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                    {hasDiscount && (
                      <span className="absolute left-3 top-3 rounded-full border border-state-success/30 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-state-success backdrop-blur-xl">
                        Ưu đãi
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 p-5 sm:p-7">
                    {product.category && (
                      <span className="w-fit rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white/45">
                        {product.category.name}
                      </span>
                    )}
                    <h2 className="text-h3 font-display leading-tight text-white">{product.name}</h2>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(product.averageRating) ? "fill-accent-orange text-accent-orange" : "text-white/15")} />
                        ))}
                      </div>
                      <span className="text-caption text-white/40">
                        {product.averageRating > 0 ? product.averageRating.toFixed(1) : "Chưa có"} · {product.reviews.length} đánh giá
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className={cn("text-[26px] font-bold tracking-tight", hasDiscount ? "text-accent-orange" : "text-white")}>{formatVnd(displayPrice)}</span>
                      {hasDiscount && <span className="text-small text-white/35 line-through">{formatVnd(product.price)}</span>}
                    </div>

                    {product.shortDescription && <p className="line-clamp-3 text-small leading-6 text-white/55">{product.shortDescription}</p>}

                    {(product.featureBullets?.length ?? 0) > 0 && (
                      <div className="grid gap-2">
                        {product.featureBullets!.slice(0, 3).map((b) => (
                          <div key={b} className="flex items-center gap-2 text-caption text-white/55">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-state-success" /> {b}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-2.5 pt-2">
                      <div className="grid grid-cols-2 gap-2.5">
                        <Button variant="secondary" className="khv-touch-target" onClick={handleAddToCart} isLoading={addToCart.isPending}>
                          <ShoppingCart className="h-3.5 w-3.5" /> Thêm giỏ hàng
                        </Button>
                        <Button className="khv-touch-target" onClick={handleBuyNow} isLoading={addToCart.isPending}>
                          Mua ngay
                        </Button>
                      </div>
                      <Link
                        href={`/san-pham/${product.slug}`}
                        className="khv-touch-target flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-caption font-semibold text-white/50 hover:text-white"
                      >
                        Xem trang chi tiết đầy đủ <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
