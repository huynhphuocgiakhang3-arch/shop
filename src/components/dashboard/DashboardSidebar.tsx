"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Wallet, Package, Download, Heart, Bell, LifeBuoy, UserCog, ShieldCheck, ChevronLeft, LogOut, Menu, X, Store, Gift } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

const NAV = [
  { href: "/trang-chu", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/gio-hang", label: "Giỏ hàng", icon: ShoppingCart },
  { href: "/vi", label: "Ví của tôi", icon: Wallet },
  { href: "/don-hang", label: "Đơn hàng", icon: Package },
  { href: "/tai-xuong", label: "Vault của tôi", icon: Download },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/gioi-thieu", label: "Giới thiệu bạn bè", icon: Gift },
  { href: "/thong-bao", label: "Thông báo", icon: Bell },
  { href: "/ho-tro", label: "Hỗ trợ", icon: LifeBuoy },
  { href: "/ho-so", label: "Hồ sơ & Cài đặt", icon: UserCog }
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useCurrentUser();
  const role = data?.user.role;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";

  const handleLogout = async () => { await api.post("/api/auth/logout"); router.push("/dang-nhap"); router.refresh(); };

  const menu = (mobile = false) => (
    <aside className={cn(
      "glass-surface flex h-[100dvh] w-[min(86vw,320px)] shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-5",
      mobile ? "fixed inset-y-0 left-0 z-[80] shadow-[30px_0_100px_rgba(0,0,0,.45)]" : "sticky top-0"
    )}>
      <div className="mb-7 flex items-center justify-between px-1">
        <Link href="/" onClick={() => mobile && setMobileOpen(false)}><Logo /></Link>
        {mobile ? <button onClick={() => setMobileOpen(false)} className="khv-touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/65" aria-label="Đóng menu"><X className="h-5 w-5" /></button> : <button onClick={() => setCollapsed(c => !c)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/5 hover:text-white/70" aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}><ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} /></button>}
      </div>
      <nav className="khv-dashboard-nav flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {NAV.map(item => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/"); const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={() => mobile && setMobileOpen(false)} className={cn("group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-small khv-interactive", active ? "bg-accent-orange/10 text-accent-orange" : "text-white/55 hover:bg-white/[.04] hover:text-white/85")}><Icon className="h-[18px] w-[18px] shrink-0" />{(!collapsed || mobile) && <span>{item.label}</span>}</Link>;
        })}
      </nav>
      {isStaff && <Link href="/admin" onClick={() => mobile && setMobileOpen(false)} className="mb-2 mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-accent-orange/20 bg-accent-orange/[.06] px-3 py-2.5 text-small text-accent-orange"><ShieldCheck className="h-[18px] w-[18px] shrink-0" />{(!collapsed || mobile) && <span>Quản trị</span>}</Link>}
      <Link href="/" onClick={() => mobile && setMobileOpen(false)} className="mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-small text-white/45 hover:bg-white/[.04] hover:text-white/75"><Store className="h-[18px] w-[18px] shrink-0" />{(!collapsed || mobile) && <span>Về trưng bày</span>}</Link>
      <button onClick={handleLogout} aria-label="Đăng xuất" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-small text-white/40 hover:bg-state-danger/10 hover:text-state-danger"><LogOut className="h-[18px] w-[18px] shrink-0" />{(!collapsed || mobile) && <span>Đăng xuất</span>}</button>
    </aside>
  );

  return <>
    <div className="hidden lg:block">{menu(false)}</div>
    <div className="lg:hidden">
      <div className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-white/[.08] bg-[#05070c]/90 px-3 backdrop-blur-2xl">
        <button onClick={() => setMobileOpen(true)} className="khv-touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.03] text-white/75" aria-label="Mở menu tài khoản"><Menu className="h-5 w-5" /></button>
        <Link href="/" aria-label="KhangHuynh Vault"><Logo /></Link>
        <Link href="/" className="flex h-10 items-center gap-1.5 rounded-xl border border-accent-orange/20 bg-accent-orange/[.06] px-3 text-[11px] font-semibold text-accent-orange"><Store className="h-3.5 w-3.5" /> Shop</Link>
      </div>
      {mobileOpen && <><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[70] bg-black/65" />{menu(true)}</>}
    </div>
  </>;
}
