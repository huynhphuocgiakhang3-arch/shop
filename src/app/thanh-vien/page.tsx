import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Thành viên Vault",
  description: "Hạng thành viên KhangHuynh Vault: FREE, SILVER, GOLD, DIAMOND. VIP (Bạc trở lên) mở khóa sản phẩm dành riêng.",
  alternates: { canonical: `${SITE_URL}/thanh-vien` },
  openGraph: {
    title: "Thành viên Vault",
    description: "Quyền lợi thành viên trên KhangHuynh Vault.",
    url: `${SITE_URL}/thanh-vien`,
    type: "website"
  }
};

const TIERS = [
  { name: "FREE", title: "Miễn phí", desc: "Mua sản phẩm công khai, dùng ví và Vault cá nhân." },
  { name: "SILVER", title: "Bạc", desc: "VIP: mua sản phẩm đánh dấu VIP, coupon hạng Bạc." },
  { name: "GOLD", title: "Vàng", desc: "VIP: ưu tiên hỗ trợ và coupon hạng Vàng." },
  { name: "DIAMOND", title: "Kim cương", desc: "VIP: đặc quyền cao nhất do Super Admin cấp." }
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <p className="text-eyebrow text-accent-orange">Membership</p>
        <h1 className="mt-2 text-h1 font-display text-white">Thành viên Vault</h1>
        <p className="mt-4 max-w-2xl text-small text-white/50">
          Hạng do Super Admin gán — không tự mua trên web. Sản phẩm gắn nhãn VIP chỉ dành cho Bạc trở lên.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, index) => (
            <div key={tier.name} className="glass-surface rounded-lg p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Hạng {index + 1}</p>
              <h2 className="mt-3 text-title text-white">{tier.title}</h2>
              <p className="mt-2 text-small text-white/45">{tier.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/ho-tro"><Button>Liên hệ nâng hạng</Button></Link>
          <Link href="/san-pham"><Button variant="secondary">Xem marketplace</Button></Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
