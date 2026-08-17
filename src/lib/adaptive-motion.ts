export type MotionTier = "reduced" | "low" | "medium" | "high";

export type MotionProfile = {
  tier: MotionTier;
  fps: number;
  frameMs: number;
  dpr: number;
  stars: number;
  particles: number;
};

export function getMotionProfile(): MotionProfile {
  if (typeof window === "undefined") {
    return { tier: "medium", fps: 45, frameMs: 1000 / 45, dpr: 1.5, stars: 150, particles: 24 };
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    return { tier: "reduced", fps: 20, frameMs: 1000 / 20, dpr: 1, stars: 55, particles: 0 };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const saveData = Boolean(nav.connection?.saveData);
  const mobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth < 768;
  const narrow = window.innerWidth < 1200;
  const slowNetwork = ["slow-2g", "2g"].includes(nav.connection?.effectiveType || "");

  if (saveData || slowNetwork || cores <= 2 || memory <= 2) {
    return { tier: "low", fps: 30, frameMs: 1000 / 30, dpr: 1, stars: mobile ? 70 : 90, particles: mobile ? 8 : 12 };
  }

  if (mobile || cores <= 4 || memory <= 4 || narrow) {
    return { tier: "medium", fps: 40, frameMs: 1000 / 40, dpr: 1.25, stars: mobile ? 90 : 150, particles: mobile ? 10 : 24 };
  }

  return { tier: "high", fps: 60, frameMs: 1000 / 60, dpr: Math.min(window.devicePixelRatio || 1, 2), stars: 220, particles: 36 };
}

export function shouldRenderFrame(now: number, last: number, frameMs: number) {
  return now - last >= frameMs;
}
