"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { getMotionProfile } from "@/lib/adaptive-motion";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  displayValue?: string;
}

function CountUp({ value, suffix, displayValue }: { value: number; suffix?: string; displayValue?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const profile = getMotionProfile();
    const reducedMotion = profile.tier === "reduced";
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    let last = start;
    const tick = (now: number) => {
      if (now - last < profile.frameMs) { raf = requestAnimationFrame(tick); return; }
      last = now;
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="text-display font-display text-white">
      {displayValue ?? display.toLocaleString("vi-VN")}
      {displayValue ? "" : suffix}
    </span>
  );
}

export function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <section className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-20">
      <div className="glass-surface grid grid-cols-2 gap-6 rounded-[30px] p-6 sm:grid-cols-4 sm:p-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <CountUp value={stat.value} suffix={stat.suffix} displayValue={stat.displayValue} />
            <span className="text-small text-white/50">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
