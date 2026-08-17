"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const ORBITS = [
  { size: "h-[88%] w-[88%]", duration: 18, z: 16, color: "orange" },
  { size: "h-[74%] w-[74%]", duration: 14, z: 34, color: "blue" },
  { size: "h-[60%] w-[60%]", duration: 11, z: 52, color: "orange" },
  { size: "h-[48%] w-[48%]", duration: 8, z: 70, color: "blue" },
];

export function VaultCore3D() {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 24, mass: .55 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-14, 14]), { stiffness: 150, damping: 24, mass: .55 });
  const glowX = useTransform(x, [-.5, .5], [35, 65]);
  const glowY = useTransform(y, [-.5, .5], [35, 65]);

  return (
    <div
      className="khv-vault-3d relative mx-auto h-[350px] w-full max-w-[620px] [perspective:1400px] sm:h-[530px]"
      onPointerMove={(event) => {
        if (event.pointerType === "touch" || reducedMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width - .5);
        y.set((event.clientY - rect.top) / rect.height - .5);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      aria-label="KhangHuynh Vault interactive 3D showcase"
    >
      <motion.div style={{ left: glowX, top: glowY }} className="absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-orange/15 blur-3xl" />
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,.20),rgba(78,145,255,.08)_38%,transparent_68%)] blur-2xl" />
      <motion.div style={{ rotateX, rotateY }} className="absolute inset-0 [transform-style:preserve-3d]">
        {ORBITS.map((orbit, index) => (
          <motion.div key={index} animate={reducedMotion ? undefined : { rotate: 360 }} transition={reducedMotion ? undefined : { duration: orbit.duration, repeat: Infinity, ease: "linear", delay: -index * 1.7 }} className={`absolute left-1/2 top-1/2 ${orbit.size} -translate-x-1/2 -translate-y-1/2 rounded-full border ${orbit.color === "orange" ? "border-accent-orange/20" : "border-accent-blue/15"} [transform-style:preserve-3d]`} style={{ transform: `translateZ(${orbit.z}px) rotateX(${index % 2 ? 64 : 72}deg) rotateY(${index % 2 ? 18 : -18}deg)` }}>
            <span className={`absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${orbit.color === "orange" ? "bg-accent-orange shadow-[0_0_24px_7px_rgba(255,138,61,.34)]" : "bg-accent-blue shadow-[0_0_22px_6px_rgba(78,145,255,.25)]"}`} />
          </motion.div>
        ))}

        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -10, 0], rotateZ: [0, 1.8, -1.2, 0] }}
          transition={reducedMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] sm:h-72 sm:w-72"
        >
          <div className="absolute inset-0 rounded-[42px] border border-white/20 bg-gradient-to-br from-white/[.18] via-white/[.035] to-accent-orange/[.10] shadow-[inset_0_1px_0_rgba(255,255,255,.42),0_50px_120px_rgba(0,0,0,.5),0_0_90px_rgba(255,138,61,.13)] backdrop-blur-2xl [transform:translateZ(16px)]" />
          <div className="absolute inset-4 rounded-[34px] border border-white/10 bg-[#080b12]/88 [transform:translateZ(34px)]" />
          <div className="absolute inset-10 rounded-[28px] border border-accent-orange/20 bg-[linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,138,61,.03))] [transform:translateZ(52px)]" />
          <div className="absolute inset-[27%] rounded-[26px] border border-accent-orange/35 bg-[radial-gradient(circle,rgba(255,138,61,.42),rgba(255,138,61,.06)_58%,transparent)] shadow-[0_0_80px_rgba(255,138,61,.22)] [transform:translateZ(68px)]" />
          <motion.div animate={reducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [.72, 1, .72] }} transition={reducedMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-[38%] rounded-2xl bg-gradient-to-br from-white via-accent-orange to-accent-orange-deep shadow-[0_0_44px_rgba(255,138,61,.52)] [transform:translateZ(84px)]" />
          <div className="absolute -right-16 top-10 w-32 rounded-2xl border border-white/10 bg-[#0b0f17]/90 p-3 shadow-2xl backdrop-blur-xl [transform:translateZ(104px)] sm:-right-20 sm:w-36">
            <p className="text-[8px] font-bold uppercase tracking-[.18em] text-white/30">Vault Core</p>
            <p className="mt-1 text-sm font-semibold text-white">Live showcase</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div animate={reducedMotion ? undefined : { x: ["-100%", "0%", "100%"] }} transition={reducedMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="h-full w-1/2 rounded-full bg-accent-orange" /></div>
          </div>
          <div className="absolute -bottom-9 -left-12 rounded-2xl border border-accent-orange/20 bg-[#0b0f17]/92 px-4 py-3 shadow-2xl backdrop-blur-xl [transform:translateZ(96px)]">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-accent-orange">Digital assets</p>
            <p className="mt-1 text-xs text-white/60">Ready to explore</p>
          </div>
        </motion.div>

        {Array.from({ length: 10 }).map((_, index) => (
          <motion.span key={`p-${index}`} animate={reducedMotion ? undefined : { y: [0, -18 - (index % 3) * 7, 0], opacity: [.15, .7, .15] }} transition={reducedMotion ? undefined : { duration: 2.8 + (index % 4) * .7, repeat: Infinity, delay: index * .17, ease: "easeInOut" }} className="absolute h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_14px_rgba(255,255,255,.35)]" style={{ left: `${18 + (index * 17) % 64}%`, top: `${16 + (index * 23) % 66}%`, transform: `translateZ(${40 + (index % 4) * 25}px)` }} />
        ))}
      </motion.div>
    </div>
  );
}
