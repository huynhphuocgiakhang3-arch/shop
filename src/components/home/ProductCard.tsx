
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAddToCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ArrowUpRight, Sparkles, Zap, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
export interface ProductCardData { id?:string; slug:string; name:string; shortDescription?:string; description?:string; thumbnailUrl:string; price:number|string; discountPrice?:number|string|null; featureBullets?:string[]; salesCount?:number; averageRating?:number; reviewCount?:number; isFeatured?:boolean; isVipOnly?:boolean; category?:{name:string}|null; }
function formatVnd(value:number|string){ return new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(value)); }
export function ProductCard({product}:{product:ProductCardData}){
  const router=useRouter(); const addToCart=useAddToCart(); const {data:userData}=useCurrentUser(); const {show}=useToast(); const discountValue=product.discountPrice!=null&&Number(product.discountPrice)<Number(product.price)?Number(product.discountPrice):null;
  const hasDiscount=discountValue!==null; const displayPrice=discountValue??product.price; const description=product.description||product.shortDescription;
  const bullets=(product.featureBullets?.length?product.featureBullets:["Giao hàng số tức thì","Kiểm duyệt & bảo mật","Hỗ trợ khách hàng 24/7"]).filter(Boolean).slice(0,6);
  return <motion.article whileHover={{y:-8}} transition={{duration:.28,ease:[.22,1,.36,1]}} data-khv-mobile-card className="khv-product-card group glass-surface khv-card-shine khv-hover-glow relative flex h-full min-h-[610px] flex-col overflow-hidden rounded-[30px] border-white/[.085] shadow-[0_24px_90px_rgba(0,0,0,.26)]">
    <Link href={`/san-pham/${product.slug}`} className="block" aria-label={`Xem ${product.name}`} onClick={() => {
      try {
        const current = JSON.parse(localStorage.getItem("khv-recent-products") || "[]") as string[];
        const next = [product.slug, ...current.filter((slug) => slug !== product.slug)].slice(0, 8);
        localStorage.setItem("khv-recent-products", JSON.stringify(next));
      } catch {}
    }}><div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-white/[.025]">
      <Image src={product.thumbnailUrl} alt={product.name} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.02),transparent_42%,rgba(0,0,0,.72))]" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">{product.isFeatured&&<span className="inline-flex items-center gap-1.5 rounded-full border border-accent-orange/35 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-accent-orange backdrop-blur-xl"><Sparkles className="h-3 w-3"/> NỔI BẬT</span>}{product.isVipOnly&&<span className="rounded-full border border-accent-blue/35 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-accent-blue backdrop-blur-xl">VIP</span>}{hasDiscount&&<span className="rounded-full border border-state-success/30 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-state-success backdrop-blur-xl">ƯU ĐÃI</span>}</div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-white/65 backdrop-blur-xl">{product.category?.name??"File hỗ trợ"}</span>{typeof product.salesCount==="number"&&product.salesCount>0&&<span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] text-white/65 backdrop-blur-xl"><Download className="h-3 w-3"/>{product.salesCount} đã bán</span>}</div>
    </div></Link>
    <div className="flex flex-1 flex-col p-5 sm:p-7"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="text-[24px] font-semibold leading-[1.12] tracking-[-.025em] text-white transition-colors group-hover:text-accent-orange">{product.name}</h3><div className="mt-2 flex flex-wrap items-center gap-1.5">{(product.reviewCount??0)>0?<>{Array.from({length:5}).map((_,i)=><span key={i} className={cn("text-[14px] leading-none",i<Math.round(product.averageRating??0)?"text-accent-orange":"text-white/15")}>★</span>)}<span className="text-[10px] text-white/35">{(product.averageRating??0).toFixed(1)} · {product.reviewCount} đánh giá</span></>:<span className="text-[10px] text-white/35">Chưa có đánh giá</span>}</div></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-white/45 transition-all group-hover:border-accent-orange/35 group-hover:bg-accent-orange/10 group-hover:text-accent-orange"><ArrowUpRight className="h-4 w-4"/></span></div>
      {description&&<p className="mt-3 line-clamp-3 text-[14px] leading-6 text-white/48">{description}</p>}
      <div className="mt-5 grid gap-2.5">{bullets.map(label=><div key={label} className="flex items-center gap-2.5 text-[13px] text-white/58"><CheckCircle2 className="h-4 w-4 shrink-0 text-state-success"/><span>{label}</span></div>)}</div>
      <div className="mt-auto pt-6"><div className="mb-4 flex items-end justify-between gap-3 border-t border-white/[.07] pt-5"><div><p className="mb-1 text-[10px] uppercase tracking-[.18em] text-white/30">Giá hiện tại</p><div className="flex flex-wrap items-baseline gap-2"><span className={cn("text-[27px] font-bold tracking-tight",hasDiscount?"text-accent-orange":"text-white")}>{formatVnd(displayPrice)}</span>{hasDiscount&&<span className="text-xs text-white/30 line-through">{formatVnd(product.price)}</span>}</div></div><span className="inline-flex items-center gap-1.5 rounded-full border border-state-success/20 bg-state-success/[.055] px-2.5 py-1.5 text-[10px] font-semibold text-state-success"><Zap className="h-3 w-3"/> Instant</span></div>
      <div className="grid grid-cols-2 gap-2.5"><Link href={`/san-pham/${product.slug}`} className="khv-touch-target flex items-center justify-center rounded-2xl border border-white/[.08] bg-white/[.025] px-3 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/60 transition-all hover:border-accent-orange/25 hover:text-white">Xem chi tiết</Link><button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();if(!userData?.user){show("Vui lòng đăng nhập để mua sản phẩm.","info");router.push("/dang-nhap");return;}addToCart.mutate({productId:product.id ?? ""}, {onSuccess:()=>router.push("/thanh-toan"),onError:(err)=>show(err instanceof ApiError?err.message:"Không thể thêm sản phẩm vào giỏ hàng.","error")});}} className="khv-touch-target khv-interactive flex items-center justify-center gap-2 rounded-2xl border border-accent-orange/35 bg-gradient-to-r from-accent-orange to-[#ff9f5c] px-3 py-3 text-[11px] font-bold uppercase tracking-[.10em] text-black shadow-[0_10px_35px_rgba(255,138,61,.18)] hover:shadow-[0_14px_45px_rgba(255,138,61,.30)]"><ShoppingCart className="h-3.5 w-3.5"/> Mua ngay</button></div></div>
    </div></motion.article>;
}
