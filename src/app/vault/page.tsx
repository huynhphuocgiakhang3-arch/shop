import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/home/ProductCard";
import { Button } from "@/components/ui/Button";
export const dynamic = "force-dynamic";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");
export const metadata: Metadata = {
  title: "Vault — Không gian trưng bày sản phẩm",
  description: "Khám phá bộ sưu tập sản phẩm số nổi bật của KhangHuynh Vault trong một không gian trưng bày cao cấp.",
  alternates: { canonical: `${SITE_URL}/vault` },
  openGraph: { title: "KhangHuynh Vault — Showroom", description: "Không gian trưng bày sản phẩm số nổi bật.", url: `${SITE_URL}/vault`, type: "website" }
};
const vaultProductSelect = {id:true,name:true,slug:true,shortDescription:true,thumbnailUrl:true,price:true,discountPrice:true,featureBullets:true,salesCount:true,isFeatured:true,isVipOnly:true,category:{select:{name:true}},_count:{select:{reviews:true}}} as const;
async function getVaultProducts() {
 return prisma.product.findMany({where:{status:"PUBLISHED"},orderBy:[{isFeatured:"desc"},{salesCount:"desc"}],take:12,select:vaultProductSelect});
}
type VaultProduct = Awaited<ReturnType<typeof getVaultProducts>>[number];
type RatingSummary = { averageRating: number; reviewCount: number };
export default async function VaultPage(){
 const products: VaultProduct[]=await getVaultProducts();
 type RatingRow = { productId: string; _avg: { rating: number | null }; _count: { _all: number } };
 const ratings=await prisma.review.groupBy({by:["productId"],where:{productId:{in:products.map((p)=>p.id)},isHidden:false},_avg:{rating:true},_count:{_all:true}}) as RatingRow[];
 const rm=new Map<string, RatingSummary>(ratings.map((r)=>[r.productId,{averageRating:Number(r._avg.rating??0),reviewCount:r._count._all}]));
 const data=products.map((p: VaultProduct)=>({...p,price:Number(p.price),discountPrice:p.discountPrice==null?null:Number(p.discountPrice),averageRating:rm.get(p.id)?.averageRating??0,reviewCount:rm.get(p.id)?.reviewCount??p._count.reviews}));
 return <div className="min-h-screen bg-bg-primary"><SiteHeader/><main className="mx-auto max-w-7xl px-4 py-10 sm:px-8"><section className="khv-atmosphere relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-accent-orange/[.13] via-white/[.03] to-accent-blue/[.07] p-7 shadow-[0_30px_100px_rgba(0,0,0,.22)] sm:p-12"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-orange/15 blur-3xl"/><p className="text-[10px] font-bold uppercase tracking-[.24em] text-accent-orange">KhangHuynh Vault</p><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Curated digital showroom</div><h1 className="mt-3 max-w-3xl text-h1 font-display text-white">Không gian trưng bày sản phẩm.</h1><p className="mt-4 max-w-2xl text-small leading-7 text-white/55">Khám phá sản phẩm nổi bật và quản lý tài sản số trong một Vault duy nhất.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/"><Button>Xem trưng bày</Button></Link><Link href="/san-pham"><Button variant="secondary">Xem Marketplace</Button></Link><Link href="/trang-chu"><Button variant="outline">Vào trang cá nhân</Button></Link></div></section><div className="mt-12 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Showcase</p><h2 className="mt-2 text-h2 font-display text-white">Bộ sưu tập nổi bật</h2></div><Link href="/san-pham" className="text-small text-accent-orange">Xem tất cả →</Link></div><div className="mt-7 grid khv-product-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map(p=><ProductCard key={p.id} product={p}/>)}</div></main><SiteFooter/></div>;}
