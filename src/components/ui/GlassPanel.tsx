import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> { radius?: "sm"|"md"|"lg"|"xl"; elevated?: boolean; }
export function GlassPanel({ className, radius="lg", elevated=true, children, ...props }: GlassPanelProps) {
  const radiusMap = { sm:"rounded-sm", md:"rounded-md", lg:"rounded-lg", xl:"rounded-xl" } as const;
  return <div className={cn("glass-surface khv-hover-glow", radiusMap[radius], elevated && "shadow-xl", className)} {...props}>{children}</div>;
}
