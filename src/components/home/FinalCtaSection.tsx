"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealSection } from "./RevealSection";
import { useCurrentUser } from "@/hooks/useProfile";

export function FinalCtaSection() {
  // Homepage renders for guests and logged-in members alike — showing
  // "Tạo tài khoản" to someone who already has one is a small but real
  // rough edge, so the primary action swaps based on session state.
  const { data } = useCurrentUser();
  const isLoggedIn = Boolean(data?.user);

  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-24">
      <div className="glass-surface khv-hover-glow relative overflow-hidden rounded-[32px] p-8 text-center sm:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(255,122,26,0.16), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-5">
          <h2 className="max-w-xl text-h2 font-display font-semibold tracking-[-.035em] text-white">
            {isLoggedIn ? "Tiếp tục khám phá Vault của bạn" : "Sẵn sàng sở hữu sản phẩm số đầu tiên của bạn?"}
          </h2>
          <p className="max-w-md text-small text-white/50">
            {isLoggedIn
              ? "Duyệt marketplace, theo dõi đơn hàng và quản lý sản phẩm đã sở hữu — tất cả trong Vault của bạn."
              : "Tạo tài khoản miễn phí, khám phá marketplace và nhận quyền truy cập tức thì vào Vault sau khi mua."}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href={isLoggedIn ? "/vi" : "/dang-ky"}
              className="khv-touch-target inline-flex items-center justify-center gap-1.5 rounded-pill bg-accent-orange px-7 py-3 text-small font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              {isLoggedIn ? "Vào Vault của tôi" : "Tạo tài khoản"} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/san-pham"
              className="khv-touch-target inline-flex items-center justify-center gap-1.5 rounded-pill border border-white/15 px-7 py-3 text-small font-semibold text-white/80 transition-colors hover:border-accent-orange/40 hover:text-white"
            >
              Khám phá marketplace
            </Link>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
