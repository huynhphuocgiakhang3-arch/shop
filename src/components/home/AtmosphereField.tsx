"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Deterministic pseudo-random so server and client render the same markup
// (no hydration mismatch) without needing Math.random() at render time.
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const MOTE_COUNT = 16;
const SHARD_COUNT = 3;

/**
 * Ambient depth layer for the Hero — small drifting motes plus a few large,
 * blurred, rotated "glass shard" panels scattered across the *whole*
 * section (not just inside the Vault Core box), so the hero reads as one
 * cohesive spatial environment rather than a single 3D object sitting on a
 * flat background. Purely decorative: aria-hidden, pointer-events-none.
 *
 * Kept cheap on purpose — only opacity/transform animate (GPU-composited,
 * no layout/paint cost), mote count is halved on narrow screens via a CSS
 * class rather than a JS width check (simpler, SSR-safe, no hydration
 * flash), and everything freezes under prefers-reduced-motion.
 */
export function AtmosphereField() {
  const reducedMotion = useReducedMotion();

  const motes = useMemo(
    () =>
      Array.from({ length: MOTE_COUNT }).map((_, i) => ({
        left: 4 + seeded(i, 1) * 92,
        top: 6 + seeded(i, 2) * 88,
        size: 2 + seeded(i, 3) * 3,
        duration: 6 + seeded(i, 4) * 7,
        delay: seeded(i, 5) * 6,
        drift: 14 + seeded(i, 6) * 22,
        hideOnMobile: i % 2 === 0
      })),
    []
  );

  const shards = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }).map((_, i) => ({
        left: 8 + seeded(i, 21) * 78,
        top: 10 + seeded(i, 22) * 72,
        width: 70 + seeded(i, 23) * 90,
        height: 46 + seeded(i, 24) * 60,
        rotate: -18 + seeded(i, 25) * 36,
        duration: 10 + seeded(i, 26) * 6,
        delay: seeded(i, 27) * 4,
        blue: i % 2 === 1
      })),
    []
  );

  return (
    <div aria-hidden className="khv-atmosphere-field pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
      {shards.map((s, i) => (
        <motion.div
          key={`shard-${i}`}
          animate={reducedMotion ? undefined : { y: [0, -18, 0], opacity: [0.5, 0.85, 0.5] }}
          transition={reducedMotion ? undefined : { duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          className={`absolute hidden rounded-[28px] border backdrop-blur-md sm:block ${
            s.blue ? "border-accent-blue/[.12] bg-accent-blue/[.03]" : "border-accent-orange/[.14] bg-accent-orange/[.03]"
          }`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.width}px`,
            height: `${s.height}px`,
            transform: `rotate(${s.rotate}deg)`,
            opacity: 0.5
          }}
        />
      ))}

      {motes.map((m, i) => (
        <motion.span
          key={`mote-${i}`}
          animate={reducedMotion ? undefined : { y: [0, -m.drift, 0], opacity: [0.1, 0.55, 0.1] }}
          transition={reducedMotion ? undefined : { duration: m.duration, repeat: Infinity, ease: "easeInOut", delay: m.delay }}
          className={`absolute rounded-full bg-white/60 ${m.hideOnMobile ? "hidden sm:block" : ""}`}
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: `${m.size}px`, height: `${m.size}px`, opacity: 0.25 }}
        />
      ))}
    </div>
  );
}
