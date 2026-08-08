"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, ShieldCheck, Palette, Wallet, QrCode, Music2, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: Package },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/admin/tin-nhan", label: "Tin nhắn", icon: MessageCircle }
];

// SUPER_ADMIN-only: Appearance (logo/favicon/backgrounds via Cloudinary) +
// Maintenance Mode. Kept out of NAV above so plain ADMIN never even sees the
// link, on top of the API being SUPER_ADMIN-gated server-side.
const SUPER_ADMIN_NAV = [
  { href: "/admin/nap-tien", label: "Yêu cầu nạp tiền", icon: Wallet },
  { href: "/admin/thanh-toan", label: "Thanh toán", icon: QrCode },
  { href: "/admin/nhac", label: "Nhạc nền", icon: Music2 },
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

  return (
    <aside className="glass-surface sticky top-0 flex h-screen w-[260px] shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-6">
      <Link href="/admin" className="mb-8 px-1">
        <Logo />
      </Link>

      {data?.user.role === "SUPER_ADMIN" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-accent-orange/10 px-3 py-2 text-caption text-accent-orange">
          <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-small transition-colors duration-standard",
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
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-small transition-colors duration-standard",
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
}
