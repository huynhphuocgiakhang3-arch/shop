"use client";

import Link from "next/link";
import Image from "next/image";
import { DollarSign, ShoppingBag, Users, LifeBuoy, Wallet, Radio } from "lucide-react";
import { useAdminOverview } from "@/hooks/admin/useAdminOverview";
import { StatCard, SectionCard, LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { formatVnd } from "@/lib/format";

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading) return <LoadingBlock />;
  if (!data) return <EmptyState title="Không thể tải dữ liệu tổng quan" description="Đã có lỗi khi tải số liệu hệ thống. Vui lòng tải lại trang." />;

  const last14Total = data.dailySeries.reduce((sum, d) => sum + d.revenue, 0);
  const last14Orders = data.dailySeries.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h2 font-display text-white">Tổng quan hệ thống</h1>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Doanh thu hôm nay" value={formatVnd(data.revenue.today)} />
        <StatCard icon={DollarSign} label="Doanh thu tháng này" value={formatVnd(data.revenue.thisMonth)} hint={`Tổng: ${formatVnd(data.revenue.total)}`} />
        <StatCard icon={Users} label="Người dùng" value={String(data.users.total)} hint={`+${data.users.newLast30Days} trong 30 ngày`} />
        <StatCard icon={ShoppingBag} label="Đơn đã thanh toán" value={String(data.orders.PAID ?? 0)} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard icon={ShoppingBag} label="Đơn đang chờ" value={String(data.orders.PENDING ?? 0)} />
        <Link href="/admin/ho-tro">
          <StatCard icon={LifeBuoy} label="Yêu cầu hỗ trợ đang mở" value={String(data.pendingTickets)} />
        </Link>
        <Link href="/admin/nap-tien">
          <StatCard icon={Wallet} label="Giao dịch ví chờ duyệt" value={String(data.pendingWalletTransactions)} />
        </Link>
      </div>

      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span>Doanh thu 14 ngày gần nhất</span>
            <span className="flex items-center gap-1 rounded-full bg-state-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-state-success">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
            </span>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-6 text-small text-white/50">
          <span>
            Tổng: <span className="font-semibold text-white">{formatVnd(last14Total)}</span>
          </span>
          <span>
            Đơn hàng: <span className="font-semibold text-white">{last14Orders}</span>
          </span>
        </div>
        <RevenueChart data={data.dailySeries} />
      </SectionCard>

      <SectionCard title="Sản phẩm bán chạy nhất">
        {data.topProducts.length === 0 ? (
          <p className="text-small text-white/40">Chưa có dữ liệu bán hàng.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {data.topProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-white/5">
                  <Image src={p.thumbnailUrl} alt={p.name} fill className="object-cover" />
                </div>
                <Link href={`/san-pham/${p.slug}`} className="flex-1 text-small text-white/80 hover:text-white line-clamp-1">
                  {p.name}
                </Link>
                <span className="text-caption text-white/40">{p.salesCount} lượt bán</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
