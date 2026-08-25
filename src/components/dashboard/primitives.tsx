"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  emphasis = false
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  /** Visually promotes the single most important metric on a dashboard
   *  (e.g. "Doanh thu hôm nay") above its siblings — accented icon well,
   *  bigger number. Without this every stat reads at equal weight, which
   *  is easy to build but is exactly the flat, undifferentiated look that
   *  separates a functional dashboard from one with real hierarchy. */
  emphasis?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassPanel radius="md" className={cn("flex flex-col gap-3 p-5", emphasis && "border-accent-orange/25 bg-accent-orange/[.03]")}>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", emphasis ? "bg-accent-orange/20 text-accent-orange" : "bg-accent-orange/10 text-accent-orange")}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn("font-display text-white", emphasis ? "text-h2" : "text-h3")}>{value}</p>
          <p className="text-caption text-white/45">{label}</p>
        </div>
        {hint && <p className="text-caption text-white/30">{hint}</p>}
      </GlassPanel>
    </motion.div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className
}: {
  title: React.ReactNode;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel radius="md" className={cn("p-6", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title text-white">{title}</h3>
        {action && (
          <Link href={action.href} className="text-caption text-accent-orange/90 hover:text-accent-orange">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </GlassPanel>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-title text-white/70">{title}</p>
      <p className="max-w-sm text-small text-white/40">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-2">
          <Button variant="secondary">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <div className="mt-2">
          <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}

export function LoadingBlock() {
  // A shimmer skeleton shaped like a typical dashboard page (stat row +
  // content panel) reads as "this is loading real content" — a spinner
  // just reads as "wait". Since this one component is reused across nearly
  // every dashboard/admin page, this single change lifts the loading state
  // everywhere at once rather than needing a per-page skeleton.
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Đang tải nội dung">
      <div className="khv-skeleton h-8 w-48 rounded-md" />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="khv-skeleton h-[104px] rounded-md" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <div className="khv-skeleton h-64 rounded-md" style={{ animationDelay: "160ms" }} />
    </div>
  );
}
