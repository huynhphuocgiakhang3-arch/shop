"use client";

import Link from "next/link";
import { ShoppingCart, Bell, Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/hooks/useProfile";

export function SiteHeader() {
  const { data } = useCurrentUser();
  const user = data?.user;

  return (
    <header className="glass-surface sticky top-0 z-30 flex h-[72px] items-center justify-between rounded-none border-x-0 border-t-0 px-4 sm:px-8">
      <Link href="/">
        <Logo />
      </Link>

      <div className="mx-6 hidden max-w-md flex-1 items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2 text-white/40 md:flex">
        <Search className="h-4 w-4" />
        <span className="text-small">Tìm kiếm sản phẩm...</span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link href="/gio-hang" aria-label="Giỏ hàng" className="text-white/60 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href="/trang-chu?tab=thong-bao" aria-label="Thông báo" className="text-white/60 hover:text-white">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/trang-chu">
              <Button variant="secondary" className="px-4 py-2 text-caption">
                Vào Vault
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dang-nhap" className="text-small text-white/70 hover:text-white">
              Đăng nhập
            </Link>
            <Link href="/dang-ky">
              <Button className="px-5 py-2 text-caption">Tạo tài khoản</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
