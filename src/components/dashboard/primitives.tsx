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
  hint
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <GlassPanel radius="md" className="flex flex-col gap-3 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-orange/10 text-accent-orange">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-h3 font-display text-white">{value}</p>
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
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
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
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-accent-orange" />
    </div>
  );
}
