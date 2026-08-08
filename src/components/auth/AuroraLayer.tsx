"use client";

import { useEffect, useRef } from "react";

/**
 * Three soft, slow-moving light fields at different depths. Pure CSS/blur,
 * no canvas — cheap to run continuously and gives the background the
 * "never stops moving, feels infinite" quality without competing with the
 * glass panel in the foreground.
 */
export function AuroraLayer() {
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reducedMotion || !isDesktop) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      curX += (targetX - curX) * 0.04;
      curY += (targetY - curY) * 0.04;

      if (farRef.current) farRef.current.style.transform = `translate3d(${curX * 10}px, ${curY * 8}px, 0)`;
      if (midRef.current) midRef.current.style.transform = `translate3d(${curX * -18}px, ${curY * -12}px, 0)`;
      if (nearRef.current) nearRef.current.style.transform = `translate3d(${curX * 26}px, ${curY * 18}px, 0)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-bg-primary">
      {/* base deep-space gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,#0d1626_0%,#05070c_55%,#020305_100%)]" />

      {/* far layer — galaxy dust, barely-there blue */}
      <div
        ref={farRef}
        className="absolute -inset-32 opacity-[0.35] blur-3xl transition-transform duration-700 will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(61,139,255,0.16), transparent 70%) 20% 30% / 55% 55% no-repeat, radial-gradient(closest-side, rgba(255,138,61,0.08), transparent 70%) 85% 75% / 45% 45% no-repeat"
        }}
      />

      {/* mid layer — slow aurora ribbon */}
      <div
        ref={midRef}
        className="absolute -inset-40 opacity-[0.3] blur-3xl transition-transform duration-700 will-change-transform animate-aurora-drift"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,138,61,0.14), transparent 65%) 70% 20% / 50% 40% no-repeat, radial-gradient(closest-side, rgba(61,139,255,0.12), transparent 65%) 25% 80% / 50% 45% no-repeat"
        }}
      />

      {/* near layer — volumetric fog near the horizon, gives foreground depth */}
      <div
        ref={nearRef}
        className="absolute inset-x-0 bottom-0 h-[55vh] opacity-[0.25] blur-2xl transition-transform duration-700 will-change-transform animate-fog-sway"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(10,17,27,0.6) 60%, rgba(10,17,27,0.85) 100%)"
        }}
      />

      {/* extremely subtle grain so gradients never band */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />
    </div>
  );
}
