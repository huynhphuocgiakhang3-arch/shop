"use client";

import { useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const ORBITS = [
  { size: "h-[86%] w-[86%]", duration: 20, z: 14, color: "orange" },
  { size: "h-[70%] w-[70%]", duration: 15, z: 30, color: "blue" },
  { size: "h-[54%] w-[54%]", duration: 11, z: 46, color: "orange" },
];

// Every offset below is expressed in % of the core's own box (never a fixed
// px value that could push content past the container edge), so nothing can
// ever clip or trigger horizontal scroll on a 320px-wide phone — the exact
// bug that made this look broken on mobile before.
export function VaultCore3D() {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Rotation range is intentionally modest (±11°) — with `translateZ` +
  // perspective on the child badges, a wider swing visually magnifies and
  // shifts them enough to push past a narrow phone's viewport edge even
  // though their flat 2D position is safely inside the container.
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 140, damping: 22, mass: 0.6 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-11, 11]), { stiffness: 140, damping: 22, mass: 0.6 });
  const glowX = useTransform(x, [-0.5, 0.5], [32, 68]);
  const glowY = useTransform(y, [-0.5, 0.5], [32, 68]);
  const sheenOpacity = useTransform(x, [-0.5, 0, 0.5], [0.15, 0.55, 0.15]);

  const dragging = useRef(false);

  // One unified handler drives both mouse-hover tilt (desktop) and drag
  // tilt (touch) so the piece is a genuinely interactive 3D object on phones
  // too, instead of going static the moment pointerType === "touch".
  const updateFromPoint = useCallback(
    (el: HTMLElement, clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      x.set(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) - 0.5);
      y.set(Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)) - 0.5);
    },
    [x, y]
  );

  return (
    <div
      className="khv-vault-3d relative mx-auto h-[320px] w-full max-w-[560px] touch-none select-none [perspective:1400px] sm:h-[480px] sm:max-w-[620px] lg:h-[560px]"
      onPointerMove={(event) => {
        if (reducedMotion) return;
        if (event.pointerType !== "touch" && event.buttons === 0) {
          updateFromPoint(event.currentTarget, event.clientX, event.clientY);
        } else if (dragging.current) {
          updateFromPoint(event.currentTarget, event.clientX, event.clientY);
        }
      }}
      onPointerDown={(event) => {
        dragging.current = true;
        updateFromPoint(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerUp={() => {
        dragging.current = false;
        x.set(0);
        y.set(0);
      }}
      onPointerLeave={() => {
        dragging.current = false;
        x.set(0);
        y.set(0);
      }}
      aria-label="KhangHuynh Vault — mô hình 3D tương tác, có thể chạm và kéo để xoay"
      role="img"
    >
      {/* Ambient light pools */}
      <motion.div
        style={{ left: glowX, top: glowY }}
        className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/20 blur-3xl sm:h-44 sm:w-44"
      />
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,.22),rgba(78,145,255,.09)_38%,transparent_68%)] blur-2xl" />
      {/* Studio floor reflection — grounds the object instead of it floating in a void */}
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-[22%] rounded-[100%] bg-[radial-gradient(ellipse,rgba(255,138,61,.16),transparent_72%)] blur-xl" />

      <motion.div style={{ rotateX, rotateY }} className="absolute inset-0 [transform-style:preserve-3d]">
        {ORBITS.map((orbit, index) => (
          <motion.div
            key={index}
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={reducedMotion ? undefined : { duration: orbit.duration, repeat: Infinity, ease: "linear", delay: -index * 1.9 }}
            className={`absolute left-1/2 top-1/2 ${orbit.size} -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              orbit.color === "orange" ? "border-accent-orange/20" : "border-accent-blue/15"
            } [transform-style:preserve-3d]`}
            style={{ transform: `translateZ(${orbit.z}px) rotateX(${index % 2 ? 66 : 74}deg) rotateY(${index % 2 ? 16 : -16}deg)` }}
          >
            <span
              className={`absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full sm:h-2.5 sm:w-2.5 ${
                orbit.color === "orange"
                  ? "bg-accent-orange shadow-[0_0_20px_6px_rgba(255,138,61,.34)]"
                  : "bg-accent-blue shadow-[0_0_18px_5px_rgba(78,145,255,.25)]"
              }`}
            />
          </motion.div>
        ))}

        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -8, 0], rotateZ: [0, 1.4, -1, 0] }}
          transition={reducedMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] sm:h-64 sm:w-64 lg:h-72 lg:w-72"
        >
          {/* Outer glass shell */}
          <div className="absolute inset-0 rounded-[32px] border border-white/20 bg-gradient-to-br from-white/[.20] via-white/[.04] to-accent-orange/[.12] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_40px_100px_rgba(0,0,0,.5),0_0_80px_rgba(255,138,61,.14)] backdrop-blur-2xl [transform:translateZ(14px)] sm:rounded-[42px]" />
          {/* Moving specular sheen — the thing that reads as "glass" instead of flat gradient */}
          <motion.div
            style={{ opacity: sheenOpacity }}
            className="absolute inset-0 overflow-hidden rounded-[32px] [transform:translateZ(15px)] sm:rounded-[42px]"
          >
            <div className="absolute -inset-y-4 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </motion.div>
          <div className="absolute inset-[9%] rounded-[26px] border border-white/10 bg-[#080b12]/88 [transform:translateZ(32px)] sm:rounded-[34px]" />
          <div className="absolute inset-[19%] rounded-[22px] border border-accent-orange/20 bg-[linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,138,61,.03))] [transform:translateZ(50px)] sm:rounded-[28px]" />
          <div className="absolute inset-[29%] rounded-[20px] border border-accent-orange/35 bg-[radial-gradient(circle,rgba(255,138,61,.42),rgba(255,138,61,.06)_58%,transparent)] shadow-[0_0_70px_rgba(255,138,61,.22)] [transform:translateZ(66px)] sm:rounded-2xl" />
          <motion.div
            animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.72, 1, 0.72] }}
            transition={reducedMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[39%] rounded-xl bg-gradient-to-br from-white via-accent-orange to-accent-orange-deep shadow-[0_0_40px_rgba(255,138,61,.55)] [transform:translateZ(82px)]"
          />

          {/* HUD chips — positioned in % of the core so they can never spill past the viewport on narrow phones. Kept just inside the core's own edge (not protruding past it) because `translateZ` + perspective visually magnifies anything sitting outside the box once the object is tilted by touch/drag — a badge hanging past the edge could swing off-screen mid-rotation even though its flat 2D position looked safe. */}
          <div className="absolute right-[2%] top-[8%] w-[38%] max-w-[128px] rounded-xl border border-white/10 bg-[#0b0f17]/92 p-2.5 shadow-2xl backdrop-blur-xl [transform:translateZ(70px)] sm:w-36 sm:rounded-2xl sm:p-3">
            <p className="text-[7px] font-bold uppercase tracking-[.16em] text-white/30 sm:text-[8px] sm:tracking-[.18em]">Vault Core</p>
            <p className="mt-1 text-[11px] font-semibold text-white sm:text-sm">Live showcase</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10 sm:mt-2 sm:h-1.5">
              <motion.div
                animate={reducedMotion ? undefined : { x: ["-100%", "0%", "100%"] }}
                transition={reducedMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 rounded-full bg-accent-orange"
              />
            </div>
          </div>
          <div className="absolute bottom-[2%] left-[2%] max-w-[46%] rounded-xl border border-accent-orange/20 bg-[#0b0f17]/94 px-2.5 py-2 shadow-2xl backdrop-blur-xl [transform:translateZ(64px)] sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[7.5px] font-bold uppercase tracking-[.14em] text-accent-orange sm:text-[9px] sm:tracking-[.18em]">Digital assets</p>
            <p className="mt-0.5 text-[10px] text-white/60 sm:mt-1 sm:text-xs">Sẵn sàng khám phá</p>
          </div>
        </motion.div>

        {Array.from({ length: 8 }).map((_, index) => (
          <motion.span
            key={`p-${index}`}
            animate={reducedMotion ? undefined : { y: [0, -16 - (index % 3) * 6, 0], opacity: [0.15, 0.7, 0.15] }}
            transition={reducedMotion ? undefined : { duration: 2.8 + (index % 4) * 0.7, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,.35)]"
            style={{ left: `${20 + (index * 17) % 58}%`, top: `${18 + (index * 23) % 60}%`, transform: `translateZ(${36 + (index % 4) * 22}px)` }}
          />
        ))}
      </motion.div>

      {/* Subtle affordance so mobile users know the object responds to touch */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-medium uppercase tracking-[.2em] text-white/25 sm:hidden">
        Chạm để xoay
      </div>
    </div>
  );
}
