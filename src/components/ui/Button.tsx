"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent-orange to-accent-orange-deep text-black font-semibold shadow-glow-orange hover:brightness-110",
  secondary: "glass-surface text-white/90 hover:bg-white/[0.09]",
  outline: "border border-white/20 text-white/90 hover:border-accent-orange/60 hover:text-accent-orange",
  ghost: "text-white/70 hover:text-white hover:bg-white/[0.06]",
  danger: "bg-state-danger/90 text-white hover:bg-state-danger"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        disabled={disabled || isLoading}
        className={cn(
          "group relative isolate inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-pill px-6 py-3 text-small font-medium transition-colors duration-standard disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...(props as any)}
      >
        {/* diagonal light sweep — visible only on primary/outline, disabled via reduced-motion in globals.css */}
        {(variant === "primary" || variant === "outline") && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
