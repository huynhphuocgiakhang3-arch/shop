"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/components/commerce/CompareProvider";
import { CompareSheet } from "@/components/commerce/CompareSheet";
import { SafeImage } from "@/components/ui/SafeImage";

export function CompareBar() {
  const { items, remove, clear } = useCompare();
  const [open, setOpen] = useState(false);
  if (items.length < 2) return null;

  return (
    <>
      <div className="khv-floating-safe">
        <div className="glass-surface flex max-w-[calc(100vw-24px)] items-center gap-3 rounded-2xl px-3 py-2 shadow-lg">
          <div className="flex -space-x-2">
            {items.map((item) => (
              <div key={item.id} className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10">
                <SafeImage src={item.thumbnailUrl} alt="" fill sizes="36px" className="object-cover" />
              </div>
            ))}
          </div>
          <p className="hidden text-[12px] text-white/70 sm:block">{items.length} sản phẩm</p>
          <button type="button" onClick={() => setOpen(true)} className="khv-touch-target inline-flex items-center gap-1.5 rounded-full bg-accent-orange px-3 text-[12px] font-bold text-black">
            <GitCompare className="h-3.5 w-3.5" /> So sánh
          </button>
          <button type="button" onClick={clear} className="khv-touch-target text-[11px] text-white/40 hover:text-white">
            Xóa
          </button>
        </div>
      </div>
      <CompareSheet open={open} onClose={() => setOpen(false)} onRemove={remove} />
    </>
  );
}

export function CompareMiniLink() {
  const { items } = useCompare();
  if (items.length === 0) return null;
  return (
    <Link href="/so-sanh" className="text-[12px] text-white/45 hover:text-white">
      So sánh ({items.length})
    </Link>
  );
}
