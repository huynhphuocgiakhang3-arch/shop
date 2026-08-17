"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";

// Next.js renders this for any uncaught error thrown while rendering a
// route segment (Server or Client Component). `error.message`/`.stack` can
// contain internals (DB error text, file paths) — never render them here;
// only `error.digest` (a short opaque id Next.js generates for server-side
// errors) is safe to show, so support can correlate it against server logs.
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[route-error]", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <GlassPanel radius="xl" className="flex flex-col items-center gap-4 p-8 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-h2 font-display text-white">Đã có lỗi xảy ra</h1>
          <p className="text-small text-white/50">
            Rất tiếc, có sự cố khi tải trang này. Bạn có thể thử lại, hoặc quay về trang chủ nếu sự cố vẫn tiếp diễn.
          </p>
          {error.digest && <p className="text-caption text-white/25">Mã lỗi: {error.digest}</p>}
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="primary" className="khv-touch-target w-full sm:w-auto" onClick={() => reset()}>
              Thử lại
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="secondary" className="khv-touch-target w-full">Về trang chủ</Button>
            </Link>
            <Link href="/lien-he" className="w-full sm:w-auto">
              <Button variant="ghost" className="khv-touch-target w-full">Liên hệ hỗ trợ</Button>
            </Link>
          </div>
        </GlassPanel>
      </main>
      <SiteFooter />
    </div>
  );
}
