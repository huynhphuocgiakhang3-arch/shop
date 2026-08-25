"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAddToCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useProfile";
import { useToggleFavorite, useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { CheckCircle2, Download, ArrowUpRight, Sparkles, Zap, ShoppingCart, Eye, Heart, GitCompare, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickViewModal } from "@/components/home/QuickViewModal";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { SafeImage } from "@/components/ui/SafeImage";
import { trackRecentlyViewed } from "@/lib/commerce/recently-viewed";
import { isNewProduct } from "@/lib/commerce/enrich-products";
import { useOwnedSet } from "@/hooks/useEntitlements";
import { useCompare } from "@/components/commerce/CompareProvider";

export interface ProductCardData {
  id?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl: string;
  price: number | string;
  discountPrice?: number | string | null;
  featureBullets?: string[];
  salesCount?: number;
  buyerCount?: number;
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isVipOnly?: boolean;
  isBestseller?: boolean;
  isEditorsPick?: boolean;
  isLimited?: boolean;
  isPopular?: boolean;
  createdAt?: string;
  version?: string | null;
  compatibility?: string | null;
  licenseType?: string | null;
  fileSizeMb?: number | null;
  category?: { name: string; slug?: string } | null;
}

function formatVnd(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value));
}

function primaryBadge(product: ProductCardData) {
  if (product.isBestseller) return { label: "Bán chạy", tone: "orange" as const };
  if (product.isFeatured) return { label: "Nổi bật", tone: "orange" as const };
  if (product.isEditorsPick) return { label: "Editor's Pick", tone: "blue" as const };
  if (product.isPopular) return { label: "Phổ biến", tone: "blue" as const };
  if (isNewProduct(product.createdAt)) return { label: "Mới", tone: "green" as const };
  return null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const toggleFavorite = useToggleFavorite();
  const { data: userData } = useCurrentUser();
  const { data: favoritesData } = useFavorites();
  const { show } = useToast();
  const { t } = useTranslation();
  const owned = useOwnedSet();
  const compare = useCompare();
  const discountValue =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.price) ? Number(product.discountPrice) : null;
  const hasDiscount = discountValue !== null;
  const displayPrice = discountValue ?? product.price;
  const description = product.description || product.shortDescription;
  const bullets = (product.featureBullets?.length ? product.featureBullets : ["Giao hàng số tức thì", "Kiểm duyệt & bảo mật", "Hỗ trợ khách hàng 24/7"])
    .filter(Boolean)
    .slice(0, 4);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const isOwned = Boolean(product.id && owned.has(product.id));
  const isWishlisted = Boolean(product.id && favoritesData?.favorites.some((item) => item.product.id === product.id));
  const badge = primaryBadge(product);
  const buyerCount = product.buyerCount ?? product.salesCount ?? 0;

  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [5, -5]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-5, 5]), { stiffness: 220, damping: 22 });
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const requireLogin = () => {
    show("Vui lòng đăng nhập để tiếp tục.", "info");
    router.push("/dang-nhap");
  };

  return (
    <motion.article
      ref={cardRef}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      data-khv-mobile-card
      className="khv-product-card group glass-surface khv-card-shine khv-hover-glow relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-[30px] border-white/[.085] shadow-[0_24px_90px_rgba(0,0,0,.26)]"
    >
      <Link
        href={`/san-pham/${product.slug}`}
        className="block"
        aria-label={`Xem ${product.name}`}
        onClick={() => trackRecentlyViewed(product.slug)}
      >
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-white/[.025]">
          <SafeImage
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.02),transparent_42%,rgba(0,0,0,.72))]" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isOwned && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-state-success/35 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-state-success backdrop-blur-xl">
                <BadgeCheck className="h-3 w-3" /> Trong Vault
              </span>
            )}
            {!isOwned && badge && (
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] backdrop-blur-xl",
                badge.tone === "orange" && "border-accent-orange/35 text-accent-orange",
                badge.tone === "blue" && "border-accent-blue/35 text-accent-blue",
                badge.tone === "green" && "border-state-success/30 text-state-success"
              )}>
                <Sparkles className="h-3 w-3" /> {t(badge.label)}
              </span>
            )}
            {hasDiscount && !isOwned && (
              <span className="rounded-full border border-state-success/30 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-state-success backdrop-blur-xl">{t("Ưu đãi")}</span>
            )}
          </div>
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              className="khv-touch-target flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-xl transition-all hover:bg-black/60 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Xem nhanh ${product.name}`}
            >
              <Eye className="h-4 w-4" />
            </button>
            {product.id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!userData?.user) return requireLogin();
                  toggleFavorite.mutate(product.id as string, {
                    onSuccess: (res) => show(res.isFavorited ? "Đã thêm vào yêu thích." : "Đã bỏ yêu thích.", "success")
                  });
                }}
                className="khv-touch-target flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-xl sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Yêu thích"
              >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-accent-orange text-accent-orange")} />
              </button>
            ) : null}
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-white/65 backdrop-blur-xl">
              {product.category?.name ?? t("File hỗ trợ")}
            </span>
            {buyerCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] text-white/65 backdrop-blur-xl">
                <Download className="h-3 w-3" />
                {buyerCount} {t("đã bán")}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[24px] font-semibold leading-[1.12] tracking-[-.025em] text-white transition-colors group-hover:text-accent-orange">{product.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(product.reviewCount ?? 0) > 0 ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={cn("text-[14px] leading-none", i < Math.round(product.averageRating ?? 0) ? "text-accent-orange" : "text-white/15")}>★</span>
                  ))}
                  <span className="text-[10px] text-white/35">
                    {(product.averageRating ?? 0).toFixed(1)} · {product.reviewCount} {t("đánh giá")}
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-white/35">{t("Chưa có đánh giá")}</span>
              )}
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-white/45 transition-all group-hover:border-accent-orange/35 group-hover:bg-accent-orange/10 group-hover:text-accent-orange">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        {description && <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-white/48">{description}</p>}
        <div className="mt-5 grid gap-2.5">
          {bullets.map((label) => (
            <div key={label} className="flex items-center gap-2.5 text-[13px] text-white/58">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-state-success" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6">
          <div className="mb-4 flex items-end justify-between gap-3 border-t border-white/[.07] pt-5">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[.18em] text-white/30">Giá hiện tại</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={cn("text-[27px] font-bold tracking-tight", hasDiscount ? "text-accent-orange" : "text-white")}>{formatVnd(displayPrice)}</span>
                {hasDiscount && <span className="text-xs text-white/30 line-through">{formatVnd(product.price)}</span>}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-state-success/20 bg-state-success/[.055] px-2.5 py-1.5 text-[10px] font-semibold text-state-success">
              <Zap className="h-3 w-3" /> Instant
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              className="khv-touch-target flex items-center justify-center gap-1.5 rounded-2xl border border-white/[.08] bg-white/[.025] px-3 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/60 transition-all hover:border-accent-orange/25 hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" /> {t("Xem nhanh")}
            </button>
            {isOwned ? (
              <button
                type="button"
                onClick={() => router.push("/tai-xuong")}
                className="khv-touch-target khv-interactive flex items-center justify-center gap-2 rounded-2xl border border-state-success/30 bg-state-success/10 px-3 py-3 text-[11px] font-bold uppercase tracking-[.10em] text-state-success"
              >
                Mở Vault
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!userData?.user) return requireLogin();
                  addToCart.mutate(
                    { productId: product.id ?? "" },
                    {
                      onSuccess: () => router.push("/thanh-toan"),
                      onError: (err) => show(err instanceof ApiError ? err.message : "Không thể thêm sản phẩm vào giỏ hàng.", "error")
                    }
                  );
                }}
                className="khv-touch-target khv-interactive flex items-center justify-center gap-2 rounded-2xl border border-accent-orange/35 bg-gradient-to-r from-accent-orange to-[#ff9f5c] px-3 py-3 text-[11px] font-bold uppercase tracking-[.10em] text-black shadow-[0_10px_35px_rgba(255,138,61,.18)]"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> {t("Mua ngay")}
              </button>
            )}
          </div>
          {product.id ? (
            <button
              type="button"
              onClick={() => {
                if (compare.has(product.id as string)) {
                  const removed = compare.remove(product.id as string);
                  show("Đã bỏ khỏi so sánh.", "info", removed ? { undoLabel: "Hoàn tác", onUndo: () => compare.restore(removed) } : undefined);
                  return;
                }
                const result = compare.add({
                  id: product.id as string,
                  slug: product.slug,
                  name: product.name,
                  thumbnailUrl: product.thumbnailUrl,
                  price: Number(product.price),
                  discountPrice: product.discountPrice == null ? null : Number(product.discountPrice),
                  version: product.version,
                  compatibility: product.compatibility,
                  licenseType: product.licenseType,
                  averageRating: product.averageRating,
                  reviewCount: product.reviewCount,
                  fileSizeMb: product.fileSizeMb
                });
                show(result.ok ? "Đã thêm vào so sánh." : result.message ?? "Không thể so sánh.", result.ok ? "success" : "info");
              }}
              className="khv-touch-target mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white/70"
            >
              <GitCompare className="h-3.5 w-3.5" />
              {compare.has(product.id) ? "Bỏ so sánh" : "So sánh"}
            </button>
          ) : null}
        </div>
      </div>
      {product.slug && <QuickViewModal slug={product.slug} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />}
    </motion.article>
  );
}
