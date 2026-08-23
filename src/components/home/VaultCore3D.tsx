"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useScroll } from "framer-motion";

// Five rings at varied depths/angles instead of three — reads less like "a
// planet with one moon" and more like an orrery/armillary-sphere mechanism.
// Each carries 1-3 tick nodes (not just a single dot) so the rings look
// like measured instrument bands, not decorative circles.
const ORBITS = [
  { size: "h-[92%] w-[92%]", duration: 26, z: 6, color: "orange", rx: 76, ry: -14, nodes: 1 },
  { size: "h-[78%] w-[78%]", duration: 19, z: 22, color: "blue", rx: 62, ry: 18, nodes: 2 },
  { size: "h-[64%] w-[64%]", duration: 32, z: 38, color: "orange", rx: 70, ry: -22, nodes: 1 },
  { size: "h-[50%] w-[50%]", duration: 14, z: 52, color: "blue", rx: 58, ry: 10, nodes: 3 },
];

// Faceted wireframe "cage" panels around the glass core — a handful of
// rotated hexagon outlines at different depths/angles read as a geodesic
// lattice enclosing the core, the detail that separates "one glowing ball"
// from "an engineered containment mechanism."
const CAGE_FACETS = [
  { rx: 14, ry: 0, rz: 0, z: 92 },
  { rx: -10, ry: 22, rz: 0, z: 92 },
  { rx: 6, ry: -24, rz: 12, z: 92 }
];

const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

function useTelemetry(reducedMotion: boolean | null) {
  const [hex, setHex] = useState("A3F1");
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setHex(Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0")), 1400);
    return () => clearInterval(id);
  }, [reducedMotion]);
  return hex;
}

// Every offset below is expressed in % of the core's own box (never a fixed
// px value that could push content past the container edge), so nothing can
// ever clip or trigger horizontal scroll on a 320px-wide phone — the exact
// bug that made this look broken on mobile before.
export function VaultCore3D() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const telemetry = useTelemetry(reducedMotion);
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
  const dialRotate = useTransform(x, [-0.5, 0.5], [-6, 6]);

  // "Camera" scroll response — as the hero scrolls up out of view, the core
  // drifts and turns away slightly and settles deeper into the scene
  // (translateZ pulls back + fades), reading as a cinematic camera move
  // rather than the object simply disappearing off the top of the page.
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const scrollRotateX = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : -14]);
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1, reducedMotion ? 1 : 0.88]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, reducedMotion ? 1 : 0.35]);

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
    <motion.div
      ref={containerRef}
      style={{ scale: scrollScale, opacity: scrollOpacity, rotateX: scrollRotateX, transformPerspective: 1400 }}
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
      {/* Ambient light pools — two-tone (orange key + faint blue rim) instead of a single flat glow */}
      <motion.div
        style={{ left: glowX, top: glowY }}
        className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/20 blur-3xl sm:h-44 sm:w-44"
      />
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,.22),rgba(78,145,255,.09)_38%,transparent_68%)] blur-2xl" />
      {/* Studio floor reflection — grounds the object instead of it floating in a void */}
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-[22%] rounded-[100%] bg-[radial-gradient(ellipse,rgba(255,138,61,.16),transparent_72%)] blur-xl" />

      {/* Radar-dial tick ring — a thin conic band of measured ticks around the
          whole scene, the single cheapest detail that reads as "engineered
          instrument" rather than "decorative circle". Rotates a few degrees
          with the pointer for a parallax "compass" feel. */}
      <motion.div
        style={{ rotate: dialRotate }}
        className="pointer-events-none absolute inset-[1%] rounded-full opacity-[.35] sm:opacity-[.4]"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "repeating-conic-gradient(rgba(255,255,255,.5) 0deg 1.2deg, transparent 1.2deg 9deg)",
            WebkitMaskImage: "radial-gradient(circle, transparent 96.5%, black 97%, black 99%, transparent 99.5%)",
            maskImage: "radial-gradient(circle, transparent 96.5%, black 97%, black 99%, transparent 99.5%)"
          }}
        />
      </motion.div>

      {/* Corner reticle brackets — the classic "targeting frame" cue borrowed
          from AR/HUD interfaces. Cheap, restrained, instantly reads as
          purposeful tech framing rather than an empty box. */}
      {(["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"] as const).map(
        (pos) => (
          <div key={pos} className={`pointer-events-none absolute h-4 w-4 border-accent-orange/25 sm:h-5 sm:w-5 ${pos}`} />
        )
      )}

      <motion.div style={{ rotateX, rotateY }} className="absolute inset-0 [transform-style:preserve-3d]">
        {ORBITS.map((orbit, index) => (
          // Positioning (center + size) lives on this plain wrapper via
          // ordinary Tailwind transform utilities. The 3D rotate/translateZ
          // below goes on an INNER element instead of sharing this one —
          // React's `style={{ transform: ... }}` completely replaces the
          // whole `transform` property, including the `-translate-x-1/2
          // -translate-y-1/2` centering from the className, if both land on
          // the same node. That silent conflict was quietly shifting every
          // ring/facet off-center (confirmed by bundling the real component
          // and measuring it in a browser — the flat mockups used in
          // earlier verification passes never would have caught this).
          <div key={index} className={`absolute left-1/2 top-1/2 ${orbit.size} -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]`}>
            <motion.div
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={reducedMotion ? undefined : { duration: orbit.duration, repeat: Infinity, ease: "linear", delay: -index * 3.1 }}
              className={`relative h-full w-full rounded-full border [transform-style:preserve-3d] ${
                orbit.color === "orange" ? "border-accent-orange/[.18]" : "border-accent-blue/[.14]"
              }`}
              style={{ transform: `translateZ(${orbit.z}px) rotateX(${orbit.rx}deg) rotateY(${orbit.ry}deg)` }}
            >
              {Array.from({ length: orbit.nodes }).map((_, ni) => (
                <span
                  key={ni}
                  className={`absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full sm:h-2 sm:w-2 ${
                    orbit.color === "orange"
                      ? "bg-accent-orange shadow-[0_0_16px_5px_rgba(255,138,61,.32)]"
                      : "bg-accent-blue shadow-[0_0_14px_4px_rgba(78,145,255,.24)]"
                  }`}
                  style={{ left: `${50 + ni * (100 / (orbit.nodes + 0.6))}%`, top: 0 }}
                />
              ))}
            </motion.div>
          </div>
        ))}

        {/* Faceted wireframe cage — hexagonal outlines at staggered depths
            enclosing the glass core, suggesting a containment lattice rather
            than a bare sphere. Same wrapper/inner split as the orbits above,
            for the same reason. */}
        {CAGE_FACETS.map((facet, i) => (
          <div key={`cage-${i}`} className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 sm:h-72 sm:w-72">
            <motion.div
              animate={reducedMotion ? undefined : { rotateZ: [facet.rz, facet.rz + 360] }}
              transition={reducedMotion ? undefined : { duration: 34 + i * 9, repeat: Infinity, ease: "linear" }}
              className="h-full w-full border border-white/[.12]"
              style={{
                transform: `translateZ(${facet.z}px) rotateX(${facet.rx}deg) rotateY(${facet.ry}deg)`,
                clipPath: HEX_CLIP
              }}
            />
          </div>
        ))}

        <div className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] sm:h-64 sm:w-64 lg:h-72 lg:w-72">
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -8, 0], rotateZ: [0, 1.4, -1, 0] }}
          transition={reducedMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-full w-full [transform-style:preserve-3d]"
        >
          {/* Outer glass shell */}
          <div className="absolute inset-0 rounded-xl border border-white/20 bg-gradient-to-br from-white/[.20] via-white/[.04] to-accent-orange/[.12] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_40px_100px_rgba(0,0,0,.5),0_0_80px_rgba(255,138,61,.14)] backdrop-blur-2xl [transform:translateZ(14px)] sm:rounded-[42px]" />
          {/* Fine blueprint grid on the shell — the texture that reads as
              "engineered surface" instead of flat gradient glass. */}
          <div
            className="absolute inset-[9%] rounded-[26px] opacity-[.14] [transform:translateZ(15px)] sm:rounded-[34px]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "12% 12%"
            }}
          />
          {/* Moving specular sheen — the thing that reads as "glass" instead of flat gradient */}
          <motion.div
            style={{ opacity: sheenOpacity }}
            className="absolute inset-0 overflow-hidden rounded-xl [transform:translateZ(15px)] sm:rounded-[42px]"
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
          {/* Telemetry readout — a small ticking hex value in the free corner.
              Pure flavor (not real data), but it's the detail that makes an
              instrument panel feel alive and "engineered" rather than static. */}
          <div className="absolute left-[2%] top-[8%] hidden font-mono text-[8px] tracking-wide text-white/25 [transform:translateZ(60px)] sm:block">
            0x{telemetry}
          </div>
        </motion.div>
        </div>

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
    </motion.div>
  );
}
