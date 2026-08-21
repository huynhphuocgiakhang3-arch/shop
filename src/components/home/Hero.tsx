"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedHeadline } from "@/components/ui/AnimatedHeadline";
import { AtmosphereField } from "./AtmosphereField";

// The 3D vault core is decorative: it loads only on the client, after
// hydration, so it never blocks first paint or the LCP headline.
const VaultCore3D = dynamic(() => import("./VaultCore3D").then((m) => m.VaultCore3D), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="mx-auto h-[300px] w-full max-w-[620px] rounded-[42px] border border-white/[.07] bg-[radial-gradient(circle_at_50%_40%,rgba(255,138,61,.16),transparent_65%)] sm:h-[530px]"
    />
  )
});

export type HeroSettings = {
  announcementEnabled?: boolean;
  announcementText?: string | null;
  heroPrimaryLine?: string;
  heroVariantLine?: string;
  heroVaultLine?: string;
  heroDescription?: string | null;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
};

export function Hero({ settings }: { settings?: HeroSettings }) {
  const primary = settings?.heroPrimaryLine || "Sản phẩm số.";
  const variant = settings?.heroVariantLine || "";
  const vault = settings?.heroVaultLine || "";
  const description =
    settings?.heroDescription ||
    "Một không gian thương mại số được thiết kế để khách hàng khám phá lâu hơn, tin tưởng nhanh hơn và mua hàng dễ hơn — từ lần chạm đầu tiên đến lúc tài sản xuất hiện trong Vault.";
  const primaryCta = settings?.heroPrimaryCta || "Khám phá Marketplace";
  const secondaryCta = settings?.heroSecondaryCta || "Mở Vault";

  // CMS-controlled lines stay first so admins keep editorial control; the
  // brand's standing phrases continue the loop.
  const phrases = [variant, vault, "Tài sản của bạn.", "Trải nghiệm khác biệt.", "Mua một lần. Sở hữu lâu dài."].filter(
    (line): line is string => Boolean(line && line.trim())
  );

  return (
    <section className="khv-atmosphere relative isolate overflow-hidden px-4 pb-16 pt-8 sm:px-8 sm:pb-24 sm:pt-12 lg:pb-28 lg:pt-16">
      <AtmosphereField />
      {settings?.announcementEnabled !== false && (
        <div className="mx-auto mb-8 flex max-w-[1380px] justify-center">
          <div className="khv-announcement inline-flex max-w-full items-center gap-2 rounded-full border border-accent-orange/20 bg-white/[.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/60 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-orange" />
            <span className="truncate">{settings?.announcementText || "KhangHuynh Vault • Kho File & Tool Premium"}</span>
          </div>
        </div>
      )}

      <div
        aria-hidden
        className="absolute inset-x-0 top-[-260px] -z-10 mx-auto h-[760px] max-w-[1200px] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,.18),rgba(79,156,255,.07)_38%,transparent_70%)] blur-3xl"
      />

      <div className="mx-auto grid max-w-[1440px] items-center gap-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-2">
        <div className="relative z-10 text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[.10] bg-white/[.05] px-4 py-2 text-[10px] font-bold uppercase tracking-[.17em] text-white/65 shadow-[0_12px_50px_rgba(0,0,0,.18)] backdrop-blur-xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-orange" /> Premium Digital Marketplace
            <span className="h-1 w-1 rounded-full bg-state-success" /> Live
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="khv-hero-title max-w-4xl text-[clamp(2.6rem,7vw,7rem)] font-semibold leading-[.94] tracking-[-.055em] text-white"
          >
            {primary}
            <br />
            <span className="khv-hero-headline text-gradient-orange">
              <AnimatedHeadline phrases={phrases} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-[17px] lg:mx-0"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row lg:justify-start"
          >
            <Link href="/san-pham" className="sm:w-auto">
              <Button className="min-h-12 w-full shadow-[0_18px_60px_rgba(255,138,61,.16)] sm:min-w-[220px]" withArrow>
                {primaryCta}
              </Button>
            </Link>
            <Link href="/vault" className="sm:w-auto">
              <Button variant="outline" className="min-h-12 w-full sm:min-w-[180px]">
                {secondaryCta} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] text-white/60 lg:justify-start">
            {["Giao hàng tức thì", "Thanh toán bằng Wallet", "Hỗ trợ trực tiếp"].map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-state-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative order-first lg:order-none">
          <VaultCore3D />
        </div>
      </div>
    </section>
  );
}
