"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

export function LoginGlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sweep, setSweep] = useState({ x: 50, y: 50 });

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 16 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 16 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    setSweep({ x: px * 100, y: py * 100 });
    rotateY.set((px - 0.5) * 4.5);
    rotateX.set((0.5 - py) * 4.5);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      className="w-full"
    >
      <GlassPanel
        radius="lg"
        className={cn(
          "relative w-full overflow-hidden border-white/[0.16] bg-white/[0.035] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-20px_40px_rgba(0,0,0,0.22)] backdrop-blur-[36px]",
          className
        )}
      >
        {/* ambient ombre so the panel still reads as an object, not a hole,
            even though the background is now much more visible through it */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/[0.15]" />
        {/* cursor-follow reflection sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300"
          style={{
            background: `radial-gradient(420px circle at ${sweep.x}% ${sweep.y}%, rgba(255,255,255,0.10), transparent 60%)`
          }}
        />
        <div className="relative">{children}</div>
      </GlassPanel>
    </motion.div>
  );
}
