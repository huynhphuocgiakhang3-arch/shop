"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Package,
  Download,
  Heart,
  Bell,
  LifeBuoy,
  UserCog,
  ShieldCheck,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

const NAV = [
  { href: "/trang-chu", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/gio-hang", label: "Giỏ hàng", icon: ShoppingCart },
  { href: "/vi", label: "Ví của tôi", icon: Wallet },
  { href: "/don-hang", label: "Đơn hàng", icon: Package },
  { href: "/tai-xuong", label: "Tải xuống", icon: Download },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/thong-bao", label: "Thông báo", icon: Bell },
  { href: "/ho-tro", label: "Hỗ trợ", icon: LifeBuoy },
  { href: "/ho-so", label: "Hồ sơ & Cài đặt", icon: UserCog }
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useCurrentUser();
  const role = data?.user.role;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    router.push("/dang-nhap");
    router.refresh();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-surface sticky top-0 flex h-screen shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-6"
    >
      <div className="mb-8 flex items-center justify-between px-1">
        {!collapsed && (
          <Link href="/">
            <Logo />
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/5 hover:text-white/70"
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-small transition-colors duration-standard",
                active ? "bg-accent-orange/10 text-accent-orange" : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-standard group-hover:rotate-[3deg]" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {isStaff && (
        <Link
          href="/admin"
          className="mb-1 flex items-center gap-3 rounded-md border border-accent-orange/20 bg-accent-orange/[0.06] px-3 py-2.5 text-small text-accent-orange transition-colors duration-standard hover:bg-accent-orange/10"
        >
          <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Quản trị</span>}
        </Link>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-small text-white/40 transition-colors hover:bg-state-danger/10 hover:text-state-danger"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span>Đăng xuất</span>}
      </button>
    </motion.aside>
  );
}
