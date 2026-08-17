"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/useOrders";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatVnd, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { value: undefined, label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "CANCELLED", label: "Đã hủy" }
] as const;

export default function OrdersPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data, isLoading } = useOrders(status);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Đơn hàng của tôi</h1>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "shrink-0 rounded-pill border px-4 py-1.5 text-small transition-colors",
              status === tab.value ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng" description="Đơn hàng của bạn sẽ hiện ở đây." actionLabel="Khám phá sản phẩm" actionHref="/san-pham" />
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((order) => (
            <Link key={order.id} href={`/don-hang/${order.id}`}>
              <GlassPanel radius="md" className="flex items-center justify-between p-5 transition-colors hover:border-white/20">
                <div>
                  <p className="text-small font-medium text-white/90">{order.orderNumber}</p>
                  <p className="text-caption text-white/40">{formatDate(order.createdAt)} · {order.items.length} sản phẩm</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("rounded-pill px-3 py-1 text-caption", ORDER_STATUS_COLOR[order.status])}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <span className="text-title font-semibold text-white">{formatVnd(order.total)}</span>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
