import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-9 w-9 shrink-0">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-accent-orange to-accent-orange-deep animate-breathe-glow" />
        <svg
          viewBox="0 0 36 36"
          className="relative h-9 w-9"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 3 L31 10.5 V25.5 L18 33 L5 25.5 V10.5 Z"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.4"
            fill="rgba(255,255,255,0.04)"
          />
          <path d="M18 3 V33 M5 10.5 L31 25.5 M31 10.5 L5 25.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
        </svg>
      </div>
      <span className="font-display text-title tracking-tight text-white">
        KhangHuynh <span className="text-gradient-orange">Vault</span>
      </span>
    </div>
  );
}
