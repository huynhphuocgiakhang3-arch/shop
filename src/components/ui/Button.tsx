"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

// framer-motion's HTMLMotionProps redefines these DOM event handlers with its own
// (PanInfo-based) signatures. Spreading raw ButtonHTMLAttributes onto motion.button
// conflicts on exactly these keys, so they must be omitted here rather than papered
// over with an `as any` cast at the spread site.
type MotionConflictingHandlers =
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onTransitionEnd";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingHandlers> { variant?: Variant; isLoading?: boolean; withArrow?: boolean; }

const variantClasses: Record<Variant,string> = {
  primary: "bg-gradient-to-br from-[#ffb06b] via-accent-orange to-accent-orange-deep text-black shadow-[0_12px_38px_rgba(255,138,61,.20)] hover:shadow-[0_16px_46px_rgba(255,138,61,.30)]",
  secondary: "glass-surface text-white/90 hover:bg-white/[0.10] hover:border-white/20",
  outline: "border border-white/15 bg-white/[0.018] text-white/90 hover:border-accent-orange/55 hover:bg-accent-orange/[0.06] hover:text-white",
  ghost: "text-white/65 hover:bg-white/[0.055] hover:text-white",
  danger: "bg-state-danger/90 text-white shadow-lg hover:bg-state-danger"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant="primary", isLoading, disabled, children, withArrow=false, ...props }, ref) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ y:-2 }} whileTap={{ scale:.975 }} transition={{ duration:.18, ease:[.22,1,.36,1] }}
      disabled={disabled || isLoading}
      className={cn("khv-interactive khv-focus group relative isolate inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-pill px-6 py-3 text-small font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50", variantClasses[variant], className)}
      {...props}
    >
      {(variant === "primary" || variant === "outline") && <span aria-hidden className="pointer-events-none absolute inset-0 -z-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />}
      <span className="relative z-10 inline-flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
        {withArrow && !isLoading && <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
      </span>
    </motion.button>
  );
});
