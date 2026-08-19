"use client";

import Image from "next/image";
import { Users, UserCheck, Wallet, Trophy } from "lucide-react";
import { useAdminReferralOverview } from "@/hooks/useReferral";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { StatCard, EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminReferralPage() {
  const { data, isLoading } = useAdminReferralOverview();

  if (isLoading) return <LoadingBlock />;
  if (!data) return <EmptyState title="Không thể tải dữ liệu" description="Đã có lỗi khi tải chương trình giới thiệu." />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Chương trình giới thiệu</h1>
        <p className="mt-1 text-small text-white/50">
          Tổng quan hiệu quả affiliate toàn hệ thống. Chỉnh tỷ lệ hoa hồng tại{" "}
          <span className="text-white/70">Giao diện &amp; Hệ thống</span> (Super Admin).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Người đang giới thiệu" value={String(data.overview.totalReferrers)} />
        <StatCard icon={UserCheck} label="Tổng lượt được mời" value={String(data.overview.totalReferred)} />
        <StatCard
          icon={Wallet}
          label="Tổng hoa hồng đã trả"
          value={formatVnd(data.overview.totalCommissionPaid)}
          hint={`${data.overview.totalPayouts} lượt chi trả`}
        />
      </div>

      <GlassPanel radius="md" className="p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-title text-white">
          <Trophy className="h-4 w-4 text-accent-orange" /> Bảng xếp hạng người giới thiệu
        </h2>
        {data.topReferrers.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu" description="Chưa có ai sử dụng chương trình giới thiệu." />
        ) : (
          <div className="flex flex-col divide-y divide-white/[.06]">
            {data.topReferrers.map((r, index) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    index === 0
                      ? "bg-accent-orange/20 text-accent-orange"
                      : index === 1
                        ? "bg-white/15 text-white/80"
                        : index === 2
                          ? "bg-[#a0651e]/25 text-[#e0a25f]"
                          : "bg-white/[.05] text-white/35"
                  )}
                >
                  {index + 1}
                </span>
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/5">
                  {r.avatarUrl ? (
                    <Image src={r.avatarUrl} alt={r.displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-small font-semibold text-white/40">
                      {r.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small text-white/85">{r.displayName}</p>
                  <p className="truncate text-caption text-white/35">{r.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-small font-semibold text-white/85">{r.referredCount} người</p>
                  <p className="text-caption text-accent-orange/90">{formatVnd(r.commissionEarned)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
