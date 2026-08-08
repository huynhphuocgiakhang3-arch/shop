"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

// A single toothed gear, drawn once and reused at 3 sizes/speeds so the
// three-gear cluster reads as one interlocking mechanism rather than three
// unrelated spinners.
function Gear({
  size,
  duration,
  reverse,
  className
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  className?: string;
}) {
  const teeth = 12;
  const cx = 50;
  const cy = 50;
  const outerR = 46;
  const innerR = 34;
  const toothLen = 8;

  const teethNodes = Array.from({ length: teeth }, (_, i) => {
    const angle = (i / teeth) * 360;
    return (
      <g key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
        <rect x={cx - 4} y={cy - outerR - toothLen} width={8} height={toothLen + 6} rx={1.5} />
      </g>
    );
  });

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ filter: "drop-shadow(0 0 18px rgba(255,138,61,0.35)) drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <defs>
        <radialGradient id={`gear-body-${size}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3a3f4a" />
          <stop offset="55%" stopColor="#1c1f26" />
          <stop offset="100%" stopColor="#0c0e12" />
        </radialGradient>
        <linearGradient id={`gear-rim-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8672A" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g fill={`url(#gear-rim-${size})`}>{teethNodes}</g>
      <circle cx={cx} cy={cy} r={outerR} fill={`url(#gear-body-${size})`} stroke="rgba(255,138,61,0.45)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={14} fill="#05070C" stroke="rgba(255,138,61,0.6)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={5} fill="#FF8A3D" opacity="0.85" />
    </motion.svg>
  );
}

export function MaintenancePage({ message }: { message?: string | null }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary">
      {/* Space / particle / gradient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(61,139,255,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(255,138,61,0.12),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1.5px 1.5px at 80% 20%, white, transparent), radial-gradient(1px 1px at 40% 85%, white, transparent), radial-gradient(1.5px 1.5px at 90% 60%, white, transparent), radial-gradient(1px 1px at 10% 60%, white, transparent)",
            backgroundSize: "100% 100%"
          }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-surface relative z-10 mx-4 flex max-w-lg flex-col items-center gap-8 rounded-lg border border-white/10 px-10 py-14 text-center shadow-xl backdrop-blur-glass"
      >
        <Logo />

        {/* Three interlocking gears — different sizes, speeds, and spin
            direction give a sense of inertia/mechanism rather than a single
            flat spinner. */}
        <div className="relative flex h-40 items-center justify-center">
          <Gear size={92} duration={9} className="relative z-10" />
          <Gear size={62} duration={5.5} reverse className="absolute -left-6 top-2 z-20" />
          <Gear size={48} duration={4} className="absolute -right-4 bottom-1 z-20" />
        </div>

        <div className="space-y-3">
          <h1 className="text-h2 font-display text-white">Website đang bảo trì</h1>
          <p className="text-body text-white/60">{message ?? "Chúng tôi sẽ quay lại sớm."}</p>
        </div>

        <motion.div
          className="h-1 w-40 overflow-hidden rounded-pill bg-white/10"
          initial={false}
        >
          <motion.div
            className="h-full w-1/3 rounded-pill bg-gradient-to-r from-accent-orange-deep to-accent-orange"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
