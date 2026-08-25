"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Bell, ShoppingCart, Sparkles, Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useProfile";
import { useCart } from "@/hooks/useCart";
import { DisplayControls } from "@/components/preferences/DisplayControls";
import { SearchCommandPalette } from "@/components/search/SearchCommandPalette";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

const NAV = [
  ["/san-pham", "Sản phẩm"],
  ["/bo-suu-tap", "Bộ sưu tập"],
  ["/vault", "Vault"],
  ["/trung-tam-tro-giup", "Trợ giúp"]
] as const;

export function SiteHeader() {
  const { data } = useCurrentUser();
  const { t } = useTranslation();
  const user = data?.user;
  const { data: cartData } = useCart();
  const cartCount = user ? cartData?.summary.itemCount ?? 0 : 0;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // The drawer below is portalled to <body> (see render) — its own ancestor
  // here is the sticky, backdrop-blurred <header>, and any WebKit browser
  // treats an ancestor's backdrop-filter as a new containing block for
  // `position: fixed` descendants. Left un-portalled, the drawer would
  // misposition/clip on iOS Safari exactly like the old floating widgets bug.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close the drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  // Lock body scroll + ESC to close while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <AnnouncementBanner />
      <header className="khv-header sticky top-0 z-40 border-b border-white/[.07] bg-[#05070c]/88 shadow-[0_10px_40px_rgba(0,0,0,.14)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#05070c]/62">
      {/* Row 1 — identity + controls. Every mobile target is ≥ 44px. */}
      <div className="mx-auto flex w-full max-w-[1380px] items-center gap-2 px-3 py-2 sm:min-h-[78px] sm:px-7 lg:px-10">
        <Link href="/" className="khv-focus shrink-0" aria-label="KhangHuynh Vault">
          <Logo />
        </Link>

        <div className="mx-auto hidden max-w-xl flex-1 lg:flex">
          <SearchCommandPalette />
        </div>

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Điều hướng chính">
          {NAV.slice(0, 4).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              data-active={pathname === href}
              className="khv-nav-indicator rounded-full px-3 py-2 text-[12px] font-medium text-white/60 transition hover:bg-white/[.05] hover:text-white"
            >
              {t(label)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <DisplayControls compact />

          {user ? (
            <>
              <Link
                href="/gio-hang"
                aria-label="Giỏ hàng"
                className="khv-touch-target khv-interactive khv-focus relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[.08] bg-white/[.03] text-white/70 hover:border-white/15 hover:text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-bold text-black">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/trang-chu?tab=thong-bao"
                aria-label="Thông báo"
                className="khv-touch-target khv-interactive khv-focus relative hidden h-11 w-11 items-center justify-center rounded-full border border-white/[.08] bg-white/[.03] text-white/70 hover:border-white/15 hover:text-white sm:flex"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link href="/trang-chu" className="hidden sm:block">
                <Button variant="secondary" className="px-5 py-2">
                  <Sparkles className="h-4 w-4 text-accent-orange" /> Vault
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dang-nhap"
                className="khv-focus hidden min-h-11 items-center rounded-full px-3 text-small font-medium text-white/70 hover:text-white lg:inline-flex"
              >
                {t("Đăng nhập")}
              </Link>
              <Link href="/dang-ky" className="hidden lg:block">
                <Button className="px-5 py-2.5 text-caption" withArrow>
                  {t("Tạo tài khoản")}
                </Button>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            className="khv-touch-target khv-press flex h-11 w-11 items-center justify-center rounded-full border border-white/[.10] bg-white/[.04] text-white/80 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Row 2 — dedicated mobile search bar. */}
      <div className="khv-mobile-searchbar mx-auto w-full max-w-[1380px] px-3 pb-2.5 sm:px-7 lg:hidden">
        <SearchCommandPalette />
      </div>
    </header>

    {mounted && mobileOpen
      ? createPortal(
          <div className="xl:hidden">
            <button
              className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
              aria-label="Đóng menu"
              onClick={() => setMobileOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu điều hướng"
              className="fixed inset-y-0 right-0 z-[90] flex w-[min(90vw,380px)] flex-col overflow-y-auto border-l border-white/10 bg-[#080b12]/97 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] shadow-[-30px_0_100px_rgba(0,0,0,.5)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-eyebrow">KhangHuynh Vault</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="khv-touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70"
                  aria-label="Đóng menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 grid gap-2" aria-label="Điều hướng di động">
                {NAV.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[52px] items-center rounded-2xl border border-white/[.08] bg-white/[.035] px-4 text-[15px] font-semibold text-white/80 active:scale-[.99]"
                  >
                    {t(label)}
                  </Link>
                ))}
              </nav>

              <div className="my-5 border-t border-white/[.08]" />

              {user ? (
                <Link
                  href="/trang-chu"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-accent-orange text-[15px] font-bold text-black"
                >
                  <LayoutDashboard className="h-4 w-4" /> {t("Mở Vault cá nhân")}
                </Link>
              ) : (
                <div className="grid gap-2">
                  <Link
                    href="/dang-nhap"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.04] text-[15px] font-semibold text-white/85"
                  >
                    <LogIn className="h-4 w-4" /> {t("Đăng nhập")}
                  </Link>
                  <Link
                    href="/dang-ky"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-accent-orange text-[15px] font-bold text-black"
                  >
                    <UserPlus className="h-4 w-4" /> {t("Tạo tài khoản")}
                  </Link>
                </div>
              )}

              <div className="my-5 border-t border-white/[.08]" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-eyebrow">Ngôn ngữ &amp; Giao diện</span>
                <DisplayControls />
              </div>
            </div>
          </div>,
          document.body
        )
      : null}
    </>
  );
}
