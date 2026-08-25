"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { StatCard, LoadingBlock, EmptyState, SectionCard } from "@/components/dashboard/primitives";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import { Activity, Database, Download, LifeBuoy, Wallet } from "lucide-react";

interface HealthPayload {
  checkedAt: string;
  website: "operational" | "down";
  database: "operational" | "down";
  payments: "operational" | "down";
  downloads: "operational" | "down";
  vault: "operational" | "down";
  support: "operational" | "down";
}

export function SuperAdminControlClient() {
  const { data: overview, isLoading } = useAdminOverview();
  const { data: health, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthPayload>("/api/health"),
    refetchInterval: 30_000
  });

  if (isLoading) return <LoadingBlock />;
  if (!overview) return <EmptyState title="Không tải được Super Admin Control" description="Không thể xác thực số liệu hệ thống." />;

  const statusLabel = (value?: string) => (value === "operational" ? "Operational" : value === "down" ? "Down" : "Unavailable");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-eyebrow text-accent-orange">Super Admin only</p>
        <h1 className="text-h2 font-display text-white">System Control</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Doanh thu hôm nay" value={String(overview.revenue.today)} />
        <StatCard icon={Activity} label="Đơn đã thanh toán" value={String(overview.orders.PAID ?? 0)} />
        <StatCard icon={LifeBuoy} label="Hỗ trợ đang mở" value={String(overview.pendingTickets)} />
        <StatCard icon={Download} label="Giao dịch ví chờ" value={String(overview.pendingWalletTransactions)} />
      </div>

      <SectionCard title="Requires attention">
        <ul className="space-y-2 text-small text-white/70">
          <li>Đơn chờ: {overview.orders.PENDING ?? 0}</li>
          <li>Hỗ trợ chờ: {overview.pendingTickets}</li>
          <li>Nạp tiền chờ: {overview.pendingWalletTransactions}</li>
        </ul>
      </SectionCard>

      <SectionCard title="System status">
        {isError || !health ? (
          <p className="text-small text-white/45">System status unavailable.</p>
        ) : (
          <div className="grid gap-2 text-small text-white/70 sm:grid-cols-2">
            <p>Website: {statusLabel(health.website)}</p>
            <p className="flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Database: {statusLabel(health.database)}</p>
            <p>Payments (Wallet): {statusLabel(health.payments)}</p>
            <p>Downloads: {statusLabel(health.downloads)}</p>
            <p>Vault: {statusLabel(health.vault)}</p>
            <p>Support: {statusLabel(health.support)}</p>
            <p className="sm:col-span-2 text-caption text-white/35">Kiểm tra lúc {new Date(health.checkedAt).toLocaleString("vi-VN")}</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
