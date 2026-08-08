import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  radius?: "sm" | "md" | "lg" | "xl";
}

export function GlassPanel({ className, radius = "lg", children, ...props }: GlassPanelProps) {
  const radiusMap = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl"
  } as const;

  return (
    <div className={cn("glass-surface shadow-lg", radiusMap[radius], className)} {...props}>
      {children}
    </div>
  );
}
