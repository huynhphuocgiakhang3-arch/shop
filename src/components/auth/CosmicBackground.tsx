"use client";

import { useEffect, useRef, useState } from "react";
import { getMotionProfile } from "@/lib/adaptive-motion";

type Star = { x: number; y: number; r: number; baseAlpha: number; twinkleSpeed: number; phase: number };
type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; blurred: boolean };
type Streak = {
  kind: "shooting" | "comet";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
} | null;

/**
 * Foreground starfield layer — sits above AuroraLayer. Renders sharp
 * twinkling stars, soft blurred galaxy dust, slow drifting particles, a
 * rare shooting star, and an even rarer comet with a fuzzy glowing head.
 * Ambient light nudges toward the cursor on desktop. Counts scale down on
 * small screens to stay battery-friendly.
 */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const profile = getMotionProfile();
    const prefersReducedMotion = profile.tier === "reduced";
    const isMobile = window.innerWidth < 768;

    let width = 0;
    let height = 0;
    let dpr = profile.dpr;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- Sharp twinkling stars ----
    const STAR_COUNT = isMobile ? Math.min(profile.stars, 90) : profile.stars;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.1 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 0.015 + 0.004,
      phase: Math.random() * Math.PI * 2
    }));

    // ---- Drifting particles: mix of sharp + soft blurred galaxy dust ----
    const PARTICLE_COUNT = isMobile ? Math.min(profile.particles, 10) : profile.particles;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: i % 5 === 0 ? Math.random() * 3.5 + 2.5 : Math.random() * 1.6 + 0.5,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -Math.random() * 0.08 - 0.02,
      alpha: Math.random() * 0.25 + 0.08,
      blurred: i % 5 === 0
    }));

    let streak: Streak = null;
    let nextStreakAt = performance.now() + 5000 + Math.random() * 6000;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    let raf = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let hidden = document.visibilityState !== "visible";
    const onVisibility = () => { hidden = document.visibilityState !== "visible"; lastTime = performance.now(); };
    document.addEventListener("visibilitychange", onVisibility);

    const render = (time: number) => {
      if (hidden) { raf = requestAnimationFrame(render); return; }
      if (time - lastTime < profile.frameMs) { raf = requestAnimationFrame(render); return; }
      const dt = Math.min(time - lastTime, 100);
      lastTime = time;
      elapsed += dt;

      ctx.clearRect(0, 0, width, height);

      // Ambient light nudging toward cursor (desktop only) — the one
      // place the background visibly "notices" the person using it.
      if (!prefersReducedMotion) {
        const cursorGlow = ctx.createRadialGradient(
          mouse.current.x,
          mouse.current.y,
          0,
          mouse.current.x,
          mouse.current.y,
          280
        );
        cursorGlow.addColorStop(0, "rgba(255,255,255,0.03)");
        cursorGlow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Stars twinkle
      for (const s of stars) {
        s.phase += s.twinkleSpeed * (prefersReducedMotion ? 0 : dt * 0.06);
        const alpha = s.baseAlpha + Math.sin(s.phase) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(alpha, 0)})`;
        ctx.fill();
      }

      // Drifting particles / soft galaxy dust
      if (!prefersReducedMotion) {
        for (const p of particles) {
          p.x += p.vx * dt * 0.5;
          p.y += p.vy * dt * 0.5;
          if (p.y < -20) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          ctx.beginPath();
          if (p.blurred) {
            // Keep the soft-dust look without per-particle canvas blur filters,
            // which are disproportionately expensive on integrated GPUs.
            ctx.arc(p.x, p.y, p.r * 1.35, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200,220,255,${p.alpha * 0.45})`;
            ctx.fill();
          } else {
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
            ctx.fill();
          }
        }
      }

      // Rare streak: mostly a thin fast shooting star, occasionally a
      // slower comet with a fuzzy glowing head.
      if (!prefersReducedMotion) {
        if (!streak && time > nextStreakAt) {
          const isComet = Math.random() < 0.25;
          streak = isComet
            ? {
                kind: "comet",
                x: width * (0.6 + Math.random() * 0.3),
                y: height * (0.05 + Math.random() * 0.15),
                vx: -0.22 - Math.random() * 0.08,
                vy: 0.14 + Math.random() * 0.06,
                life: 0,
                maxLife: 2600 + Math.random() * 800
              }
            : {
                kind: "shooting",
                x: width * (0.55 + Math.random() * 0.35),
                y: height * Math.random() * 0.2,
                vx: -0.55 - Math.random() * 0.25,
                vy: 0.3 + Math.random() * 0.15,
                life: 0,
                maxLife: 900 + Math.random() * 400
              };
        }
        if (streak) {
          streak.life += dt;
          streak.x += streak.vx * dt;
          streak.y += streak.vy * dt;
          const t = streak.life / streak.maxLife;
          const fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
          const a = Math.max(fade, 0);

          ctx.save();
          if (streak.kind === "shooting") {
            ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(streak.x, streak.y);
            ctx.lineTo(streak.x - streak.vx * 26, streak.y - streak.vy * 26);
            ctx.stroke();
          } else {
            const tailX = streak.x - streak.vx * 90;
            const tailY = streak.y - streak.vy * 90;
            const grad = ctx.createLinearGradient(streak.x, streak.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255,225,190,${a * 0.9})`);
            grad.addColorStop(1, "rgba(255,225,190,0)");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(streak.x, streak.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(streak.x, streak.y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,240,220,${a})`;
            ctx.fill();
          }
          ctx.restore();

          if (t >= 1) {
            streak = null;
            nextStreakAt = time + 7000 + Math.random() * 10000;
          }
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    const readyTimeout = setTimeout(() => setReady(true), 30);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(readyTimeout);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-entrance ease-out"
      style={{ opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}
