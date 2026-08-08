"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  slug: string;
  name: string;
  shortDescription?: string;
  thumbnailUrl: string;
  price: number | string;
  discountPrice?: number | string | null;
  salesCount?: number;
  isFeatured?: boolean;
  isVipOnly?: boolean;
  category?: { name: string } | null;
}

function formatVnd(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value));
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discountValue =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.price)
      ? Number(product.discountPrice)
      : null;
  const hasDiscount = discountValue !== null;
  const displayPrice = discountValue ?? product.price;

  return (
    <Link href={`/san-pham/${product.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="glass-surface relative overflow-hidden rounded-lg"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {(product.isFeatured || product.isVipOnly || hasDiscount) && (
            <div className="absolute left-3 top-3 flex gap-1.5">
              {product.isFeatured && (
                <span className="rounded-pill bg-accent-orange/90 px-2.5 py-1 text-caption font-semibold text-black">NỔI BẬT</span>
              )}
              {product.isVipOnly && (
                <span className="rounded-pill bg-accent-blue/90 px-2.5 py-1 text-caption font-semibold text-black">VIP</span>
              )}
              {hasDiscount && (
                <span className="rounded-pill bg-state-danger/90 px-2.5 py-1 text-caption font-semibold text-white">GIẢM GIÁ</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-4">
          {product.category && <span className="text-caption uppercase tracking-wide text-white/40">{product.category.name}</span>}
          <h3 className="text-title text-white line-clamp-1">{product.name}</h3>
          {product.shortDescription && (
            <p className="text-small text-white/50 line-clamp-2">{product.shortDescription}</p>
          )}

          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-title font-semibold", hasDiscount ? "text-accent-orange" : "text-white")}>
                {formatVnd(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-caption text-white/35 line-through">{formatVnd(product.price)}</span>
              )}
            </div>
            {typeof product.salesCount === "number" && product.salesCount > 0 && (
              <span className="flex items-center gap-1 text-caption text-white/40">
                <Download className="h-3 w-3" /> {product.salesCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
