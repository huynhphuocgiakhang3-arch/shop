"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Pencil, X } from "lucide-react";
import { useAdminOrders, useUpdateOrderStatus, useRefundOrder, useEditOrder, type AdminOrderListItem } from "@/hooks/admin/useAdminOrders";
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
  { value: "PAID", label: "Đã hoàn tất" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "CANCELLED", label: "Đã hủy" }
] as const;

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAdminOrders(status);
  const updateStatus = useUpdateOrderStatus();
  const refundOrder = useRefundOrder();
  const editOrder = useEditOrder();
  const { show } = useToast();
  const [confirmRefund, setConfirmRefund] = useState<AdminOrderListItem | null>(null);
  const [editing, setEditing] = useState<AdminOrderListItem | null>(null);
  const [editStatus, setEditStatus] = useState<AdminOrderListItem["status"]>("PAID");
  const [editNote, setEditNote] = useState("");

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


  const openEditor = (order: AdminOrderListItem) => {
    setEditing(order);
    setEditStatus(order.status);
    setEditNote("");
  };

  const saveEdit = () => {
    if (!editing) return;
    editOrder.mutate({ id: editing.id, data: { status: editStatus, adminNote: editNote.trim() || null } }, {
      onSuccess: () => { show(`Đã cập nhật đơn ${editing.orderNumber}.`, "success"); setEditing(null); },
      onError: (err) => show(err instanceof ApiError ? err.message : "Không thể cập nhật đơn hàng.", "error")
    });
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
                        <>
                          <button onClick={() => openEditor(order)} className="khv-touch-target flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:bg-accent-orange/10 hover:text-accent-orange" aria-label="Chỉnh sửa đơn hoàn tất" title="Chỉnh sửa đơn">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmRefund(order)} className="khv-touch-target flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:bg-accent-blue/10 hover:text-accent-blue" aria-label="Hoàn tiền" title="Hoàn tiền">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {order.status !== "PAID" && order.status !== "PENDING" && (
                        <button onClick={() => openEditor(order)} className="khv-touch-target flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:bg-accent-orange/10 hover:text-accent-orange" aria-label="Chỉnh sửa đơn" title="Chỉnh sửa đơn">
                          <Pencil className="h-4 w-4" />
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


      {editing && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 p-3 backdrop-blur-md sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b0f17]/96 p-5 shadow-[0_40px_140px_rgba(0,0,0,.55)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent-orange">Order editor</p><h2 className="mt-2 text-xl font-semibold text-white">Chỉnh sửa {editing.orderNumber}</h2><p className="mt-1 text-sm text-white/45">Dùng cho điều chỉnh vận hành sau khi đơn đã hoàn tất.</p></div>
              <button onClick={() => setEditing(null)} className="khv-touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/55" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-white/60">Trạng thái<select value={editStatus} onChange={(e) => setEditStatus(e.target.value as AdminOrderListItem["status"])} className="min-h-12 rounded-xl border border-white/10 bg-white/[.04] px-3 text-white outline-none"><option value="PENDING">Đang chờ</option><option value="PAID">Đã hoàn tất</option><option value="REFUNDED">Đã hoàn tiền</option><option value="CANCELLED">Đã hủy</option></select></label>
              <label className="grid gap-2 text-sm text-white/60">Ghi chú quản trị<textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={4} placeholder="Ghi chú nội bộ cho đơn hàng..." className="resize-none rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent-orange/40" /></label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/60">Hủy</button><button disabled={editOrder.isPending} onClick={saveEdit} className="min-h-11 rounded-xl bg-accent-orange px-5 text-sm font-bold text-black disabled:opacity-50">{editOrder.isPending ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
          </div>
        </div>
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
