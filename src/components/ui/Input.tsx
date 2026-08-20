"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, rightElement, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-small text-white/70">
          {label}
        </label>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border bg-white/[0.03] px-4 py-3 transition-all duration-standard",
            "border-white/10 hover:border-white/20",
            focused && "border-accent-orange/70 shadow-glow-orange",
            error && "border-state-danger/70",
            success && "border-state-success/70",
            props.disabled && "cursor-not-allowed opacity-50 hover:border-white/10"
          )}
        >
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          {rightElement}
          {success && !error && <Check className="h-4 w-4 shrink-0 text-state-success" />}
          {error && <AlertCircle className="h-4 w-4 shrink-0 text-state-danger" />}
        </div>
        {error && <span className="text-caption text-state-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
