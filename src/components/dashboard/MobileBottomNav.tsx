"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Home, Vault, Package, Bell, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/trang-chu", label: "Trang chủ", icon: Home },
  { href: "/tai-xuong", label: "Vault", icon: Vault },
  { href: "/don-hang", label: "Đơn hàng", icon: Package },
  { href: "/thong-bao", label: "Thông báo", icon: Bell },
  { href: "/ho-so", label: "Tài khoản", icon: UserCog }
];

/**
 * Mobile-only primary navigation for the signed-in area. Portalled to
 * <body> — `<main>` in the dashboard/admin layouts now wraps its page
 * content in a page-transition wrapper that animates `opacity`/`transform`
 * on every route change, and any ancestor doing that would hijack this
 * `position: fixed` nav's containing block on WebKit (the exact bug fixed
 * for the music/chat widgets, the nav drawer, and the search modal earlier
 * — same fix, applied preemptively here before it could ever bite).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nav = (
    <nav
      aria-label="Điều hướng nhanh"
      className="khv-bottom-nav fixed inset-x-0 bottom-0 z-[60] border-t border-white/[.08] bg-[#05070c]/94 px-2 pt-1.5 backdrop-blur-2xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "khv-press flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-accent-orange" : "text-white/55"
                )}
              >
                <Icon className="h-[19px] w-[19px]" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
