"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Wraps every route's content so navigating anywhere in the app gets a
 * quick, consistent transition instead of a hard cut — keyed by pathname so
 * React remounts (and re-triggers the enter animation on) every navigation.
 *
 * Deliberately fast (180ms) and small (8px) per the "fast + cinematic, not
 * a slow animation" brief — this should read as polish, not a loading
 * screen. Only `opacity`/`transform` animate (GPU-composited, no layout
 * cost) and prefers-reduced-motion disables it entirely.
 *
 * Does NOT wrap floating widgets, the mobile nav drawer, search modal, or
 * bottom nav — those are all portalled straight to <body> specifically so
 * that a transform on an ancestor like this one can never hijack their
 * `position: fixed` containing block (the recurring bug fixed earlier this
 * project). This component only ever wraps ordinary in-flow page content.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
