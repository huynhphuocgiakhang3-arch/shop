"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="text-display font-display text-white">
      {display.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

export function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
      <div className="glass-surface grid grid-cols-2 gap-8 rounded-lg p-8 sm:grid-cols-4 sm:p-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <CountUp value={stat.value} suffix={stat.suffix} />
            <span className="text-small text-white/50">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
