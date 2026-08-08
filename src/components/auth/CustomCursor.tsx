"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isDesktop || reducedMotion) return;
    setEnabled(true);

    let ringX = 0;
    let ringY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`;
      }
      const el = document.elementFromPoint(targetX, targetY);
      setExpanded(!!el?.closest("a, button, input, [role='button']"));
    };

    let raf = 0;
    const animateRing = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      raf = requestAnimationFrame(animateRing);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-orange/50 transition-[width,height] duration-200 ease-out"
        style={{ width: expanded ? 44 : 28, height: expanded ? 44 : 28 }}
      />
    </>
  );
}
