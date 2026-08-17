import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";

// A URL that doesn't resolve to any route lands here (Next.js's App Router
// convention). Kept static and free of user input so it can't ever leak
// anything about why the lookup failed.
export const metadata: Metadata = { title: "Không tìm thấy trang", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <GlassPanel radius="xl" className="flex flex-col items-center gap-4 p-8 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-orange/10 text-accent-orange">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-h2 font-display text-white">404 — Không tìm thấy trang</h1>
          <p className="text-small text-white/50">
            Trang bạn đang tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại trang chủ hoặc tiếp tục khám phá marketplace.
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" className="khv-touch-target w-full">Về trang chủ</Button>
            </Link>
            <Link href="/san-pham" className="w-full sm:w-auto">
              <Button variant="secondary" className="khv-touch-target w-full">Xem sản phẩm</Button>
            </Link>
          </div>
        </GlassPanel>
      </main>
      <SiteFooter />
    </div>
  );
}
