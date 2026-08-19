"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Package, ShoppingBag, Users, LogOut, ShieldCheck, Palette, Wallet, QrCode, Music2, MessageCircle, Tags, TicketPercent, Star, CircleHelp, Megaphone, LifeBuoy, Download, ShieldAlert, Gift } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { DisplayControls } from "@/components/preferences/DisplayControls";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: Package },
  { href: "/admin/danh-muc", label: "Danh mục", icon: Tags },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/tai-xuong", label: "Lịch sử tải xuống", icon: Download },
  { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/admin/gioi-thieu", label: "Giới thiệu bạn bè", icon: Gift },
  { href: "/admin/ho-tro", label: "Hỗ trợ", icon: LifeBuoy },
  { href: "/admin/tin-nhan", label: "Tin nhắn", icon: MessageCircle },
  { href: "/admin/ma-giam-gia", label: "Mã giảm giá", icon: TicketPercent },
  { href: "/admin/danh-gia", label: "Đánh giá", icon: Star },
  { href: "/admin/cau-hoi", label: "Câu hỏi thường gặp", icon: CircleHelp }
];

// SUPER_ADMIN-only: Appearance (logo/favicon/backgrounds via Cloudinary) +
// Maintenance Mode. Kept out of NAV above so plain ADMIN never even sees the
// link, on top of the API being SUPER_ADMIN-gated server-side.
const SUPER_ADMIN_NAV = [
  { href: "/admin/nap-tien", label: "Yêu cầu nạp tiền", icon: Wallet },
  { href: "/admin/thanh-toan", label: "Thanh toán", icon: QrCode },
  { href: "/admin/nhac", label: "Nhạc nền", icon: Music2 },
  { href: "/admin/thong-bao-he-thong", label: "Thông báo hệ thống", icon: Megaphone },
  { href: "/admin/nhat-ky-he-thong", label: "Nhật ký hệ thống", icon: ShieldAlert },
  { href: "/admin/giao-dien", label: "Giao diện & Hệ thống", icon: Palette }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useCurrentUser();

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    router.push("/dang-nhap");
    router.refresh();
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (mobile = false) => (
    <aside className={cn(
      "glass-surface flex h-screen w-[280px] shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-5",
      mobile ? "fixed inset-y-0 left-0 z-[70] shadow-[30px_0_100px_rgba(0,0,0,.45)]" : "sticky top-0"
    )}>
      <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Admin Command Center</span><div className="flex items-center gap-1"><DisplayControls compact />{mobile && <button type="button" onClick={()=>setMobileOpen(false)} className="khv-touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60" aria-label="Đóng menu"><X className="h-5 w-5"/></button>}</div></div>
      <Link href="/admin" className="mb-8 px-1">
        <Logo />
      </Link>

      {data?.user.role === "SUPER_ADMIN" && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-accent-orange/15 bg-accent-orange/10 px-3 py-3 text-caption font-semibold text-accent-orange">
          <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
        </div>
      )}

      <nav className="khv-admin-nav flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={()=>mobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-small khv-interactive khv-interactive transition-colors duration-standard",
                active ? "bg-accent-orange/10 text-accent-orange" : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {data?.user.role === "SUPER_ADMIN" && (
          <>
            <div className="my-2 border-t border-white/[0.06]" />
            {SUPER_ADMIN_NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={()=>mobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-small khv-interactive khv-interactive transition-colors duration-standard",
                    active ? "bg-accent-orange/10 text-accent-orange" : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <Link href="/trang-chu" className="mb-1 rounded-md px-3 py-2.5 text-small text-white/40 hover:bg-white/[0.04] hover:text-white/70">
        ← Về trang người dùng
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-small text-white/40 hover:bg-state-danger/10 hover:text-state-danger"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" /> Đăng xuất
      </button>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebar(false)}</div>
      <div className="lg:hidden">
        <div className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-white/[.08] bg-[#05070c]/90 px-3 backdrop-blur-2xl">
          <button type="button" onClick={()=>setMobileOpen(true)} className="khv-touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.03] text-white/75" aria-label="Mở menu quản trị"><Menu className="h-5 w-5"/></button>
          <Link href="/admin" aria-label="Admin"><Logo /></Link>
          <Link href="/trang-chu" className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-semibold text-white/60">Shop</Link>
        </div>
        {mobileOpen && <><button aria-label="Đóng menu" onClick={()=>setMobileOpen(false)} className="fixed inset-0 z-[60] bg-black/60 lg:hidden" />{sidebar(true)}</>}
      </div>
    </>
  );
}
