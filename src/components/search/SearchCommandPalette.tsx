"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Command, FolderSearch, Search, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type SearchProduct = { id: string; name: string; slug: string; thumbnailUrl: string | null; price: unknown; discountPrice: unknown };
type SearchCategory = { id: string; name: string; slug: string };
type SearchResponse = { products: SearchProduct[]; categories: SearchCategory[] };

function formatPrice(value: unknown) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(number);
}

export function SearchCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResponse>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  // Portalled to <body> when open — this component is instantiated inside
  // SiteHeader's backdrop-blurred <header>, which would otherwise hijack
  // the containing block for this modal's `fixed inset-0` overlay on iOS
  // Safari (same class of bug as the old floating widgets / nav drawer).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const value = q.trim();
    if (value.length < 2) {
      setData({ products: [], categories: [] });
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api.get<SearchResponse>(`/api/search?q=${encodeURIComponent(value)}`, { silent: true });
        setData(result);
      } catch {
        setData({ products: [], categories: [] });
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [q, open]);

  const close = () => { setOpen(false); setQ(""); };
  const go = (href: string) => { close(); router.push(href); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="khv-focus khv-interactive flex h-11 min-w-0 w-full items-center rounded-full border border-white/[.09] bg-white/[.035] px-3 text-left text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] lg:px-4" aria-label="Mở tìm kiếm">
        <Search className="mr-2.5 h-4 w-4 shrink-0" />
        <span className="hidden truncate text-small sm:block">Tìm kiếm sản phẩm, danh mục...</span>
        <span className="text-small sm:hidden">Tìm kiếm...</span>
        <kbd className="ml-auto hidden rounded-lg border border-white/10 bg-white/[.035] px-2 py-1 text-[10px] text-white/30 sm:block">⌘ K</kbd>
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-3 pt-[9vh] backdrop-blur-md sm:px-6" onMouseDown={(e) => { if (e.currentTarget === e.target) close(); }}>
          <div className="glass-surface khv-search-modal page-enter w-full max-w-3xl overflow-hidden rounded-[28px] border-white/[.14] shadow-[0_40px_120px_rgba(0,0,0,.65)]" role="dialog" aria-modal="true" aria-label="Tìm kiếm">
            <div className="flex items-center gap-3 border-b border-white/[.08] px-4 py-4 sm:px-5">
              <Search className="h-5 w-5 text-accent-orange" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) go(`/san-pham?q=${encodeURIComponent(q.trim())}`); }} placeholder="Tìm sản phẩm, danh mục, từ khóa..." className="min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/30" />
              <button type="button" onClick={close} className="khv-touch-target khv-focus flex h-10 w-10 items-center justify-center rounded-full bg-white/[.05] text-white/50 hover:text-white" aria-label="Đóng tìm kiếm"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-4">
              {q.trim().length < 2 ? (
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <button type="button" onClick={() => go("/san-pham?sort=popular")} className="khv-interactive rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-left"><Sparkles className="mb-3 h-5 w-5 text-accent-orange" /><div className="font-semibold text-white">Khám phá bán chạy</div><div className="mt-1 text-sm text-white/40">Những sản phẩm được quan tâm nhiều nhất.</div></button>
                  <button type="button" onClick={() => go("/san-pham?sort=newest")} className="khv-interactive rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-left"><Command className="mb-3 h-5 w-5 text-accent-blue" /><div className="font-semibold text-white">Sản phẩm mới</div><div className="mt-1 text-sm text-white/40">Xem những sản phẩm vừa được cập nhật.</div></button>
                </div>
              ) : loading ? (
                <div className="space-y-2 p-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[.045]" />)}</div>
              ) : data.products.length === 0 && data.categories.length === 0 ? (
                <div className="p-10 text-center"><FolderSearch className="mx-auto h-10 w-10 text-white/20" /><p className="mt-4 font-medium text-white">Không tìm thấy kết quả</p><p className="mt-1 text-sm text-white/35">Thử một từ khóa khác hoặc mở Marketplace.</p><button type="button" onClick={() => go(`/san-pham?q=${encodeURIComponent(q.trim())}`)} className="mt-5 rounded-full bg-accent-orange px-5 py-2.5 text-sm font-bold text-black">Tìm trong Marketplace</button></div>
              ) : (
                <div className="space-y-5">
                  {data.products.length > 0 ? <section><div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">Sản phẩm</div><div className="grid gap-2">{data.products.map((product) => { const price = product.discountPrice ?? product.price; return <button key={product.id} type="button" onClick={() => go(`/san-pham/${product.slug}`)} className="khv-interactive flex w-full items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.02] p-2.5 text-left hover:border-accent-orange/25 hover:bg-white/[.045]"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[.05]">{product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white/20"><Sparkles className="h-5 w-5" /></div>}</div><div className="min-w-0 flex-1"><div className="truncate font-semibold text-white">{product.name}</div><div className="mt-1 text-xs text-accent-orange">{formatPrice(price)}</div></div><ArrowRight className="mr-2 h-4 w-4 shrink-0 text-white/25" /></button>; })}</div></section> : null}
                  {data.categories.length > 0 ? <section><div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">Danh mục</div><div className="flex flex-wrap gap-2">{data.categories.map((category) => <Link key={category.id} href={`/san-pham?category=${encodeURIComponent(category.slug)}`} onClick={close} className={cn("rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-sm text-white/70 transition hover:border-accent-orange/30 hover:text-white")}>{category.name}</Link>)}</div></section> : null}
                </div>
              )}
            </div>
            <div className="hidden items-center justify-between border-t border-white/[.07] px-5 py-3 text-[11px] text-white/25 sm:flex"><span>Enter để mở kết quả · Esc để đóng</span><span>KhangHuynh Vault Search</span></div>
          </div>
        </div>,
          document.body
          )
        : null}
    </>
  );
}
