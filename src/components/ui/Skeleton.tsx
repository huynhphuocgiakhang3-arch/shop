import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("khv-skeleton animate-pulse rounded-xl bg-white/[.06]", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-surface overflow-hidden rounded-[24px] p-0">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
