"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useAdminOrders, useUpdateOrderStatus, useRefundOrder, type AdminOrderListItem } from "@/hooks/admin/useAdminOrders";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TABS = [
  { value: undefined, label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "CANCELLED", label: "Đã hủy" }
] as const;

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAdminOrders(status);
  const updateStatus = useUpdateOrderStatus();
  const refundOrder = useRefundOrder();
  const { show } = useToast();
  const [confirmRefund, setConfirmRefund] = useState<AdminOrderListItem | null>(null);

  const handleConfirmPaid = (order: AdminOrderListItem) => {
    updateStatus.mutate(
      { id: order.id, status: "PAID" },
      {
        onSuccess: () => show(`Đã xác nhận thanh toán đơn ${order.orderNumber}.`, "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleCancel = (order: AdminOrderListItem) => {
    updateStatus.mutate(
      { id: order.id, status: "CANCELLED" },
      {
        onSuccess: () => show(`Đã hủy đơn ${order.orderNumber}.`, "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  const handleRefund = () => {
    if (!confirmRefund) return;
    refundOrder.mutate(confirmRefund.id, {
      onSuccess: () => {
        show(`Đã hoàn tiền đơn ${confirmRefund.orderNumber}.`, "success");
        setConfirmRefund(null);
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 font-display text-white">Quản lý đơn hàng</h1>

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
        <EmptyState title="Không có đơn hàng" description="Đơn hàng sẽ xuất hiện tại đây khi khách hàng đặt mua." />
      ) : (
        <GlassPanel radius="md" className="overflow-x-auto p-0">
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-white/10 text-caption text-white/40">
                <th className="px-5 py-3">Mã đơn</th>
                <th className="px-5 py-3">Khách hàng</th>
                <th className="px-5 py-3">Ngày đặt</th>
                <th className="px-5 py-3">Tổng tiền</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-white/85">{order.orderNumber}</td>
                  <td className="px-5 py-3">
                    <p className="text-white/80">{order.user.displayName}</p>
                    <p className="text-caption text-white/35">{order.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-white/50">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-3 text-white/70">{formatVnd(order.total)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-pill px-2.5 py-1 text-caption", ORDER_STATUS_COLOR[order.status])}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {order.status === "PENDING" && (
                        <>
                          <button onClick={() => handleConfirmPaid(order)} className="text-white/40 hover:text-state-success" aria-label="Xác nhận thanh toán">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleCancel(order)} className="text-white/40 hover:text-state-danger" aria-label="Hủy đơn">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {order.status === "PAID" && (
                        <button onClick={() => setConfirmRefund(order)} className="text-white/40 hover:text-accent-blue" aria-label="Hoàn tiền">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <ConfirmDialog
        open={Boolean(confirmRefund)}
        title="Hoàn tiền đơn hàng?"
        description={`Số tiền ${confirmRefund ? formatVnd(confirmRefund.total) : ""} sẽ được hoàn vào ví của khách hàng.`}
        confirmLabel="Hoàn tiền"
        danger={false}
        isLoading={refundOrder.isPending}
        onConfirm={handleRefund}
        onCancel={() => setConfirmRefund(null)}
      />
    </div>
  );
}
