"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-8 sm:pt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,138,61,0.10),transparent_60%)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-4 py-1.5 text-caption text-white/60"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-accent-orange" />
          Nền tảng thương mại số cao cấp
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-display font-display text-white"
        >
          Sản phẩm số. <span className="text-gradient-orange">Đẳng cấp Vault.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 max-w-xl text-subtitle text-white/55"
        >
          Khám phá phần mềm, tài khoản, tài nguyên thiết kế và dịch vụ số được tuyển chọn kỹ lưỡng —
          bảo mật, minh bạch và giao hàng tức thì.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/san-pham">
            <Button className="w-full sm:w-auto">
              Khám phá Marketplace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/thanh-vien">
            <Button variant="outline" className="w-full sm:w-auto">
              Trở thành thành viên VIP
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
