"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, LifeBuoy, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useOrder } from "@/hooks/useOrders";
import { useGenerateDownload } from "@/hooks/useDownloads";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useOrder(params.id);
  const generateDownload = useGenerateDownload();
  const { show } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading) return <LoadingBlock />;
  if (!data) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Đơn hàng này không tồn tại hoặc bạn không có quyền xem."
        actionLabel="Xem đơn hàng của tôi"
        actionHref="/don-hang"
      />
    );
  }

  const { order } = data;

  const handleDownload = (orderItemId: string) => {
    generateDownload.mutate(orderItemId, {
      onSuccess: (res) => window.open(res.downloadUrl, "_blank"),
      onError: (err) => show(err instanceof ApiError ? err.message : "Không thể tạo liên kết tải xuống.", "error")
    });
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    show("Đã sao chép mã giấy phép.", "success");
  };

  const steps = [
    { label: "Đơn được tạo", done: true, at: order.createdAt },
    { label: "Thanh toán", done: order.status === "PAID" || order.status === "REFUNDED", at: order.paidAt },
    { label: "Vào Vault", done: order.status === "PAID", at: order.paidAt },
    { label: "Hoàn tiền", done: order.status === "REFUNDED", at: order.status === "REFUNDED" ? order.paidAt : null }
  ].filter((step) => step.label !== "Hoàn tiền" || order.status === "REFUNDED");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.push("/don-hang")} className="flex w-fit items-center gap-2 text-small text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <GlassPanel radius="lg" className="p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-caption text-white/40">Biên nhận</p>
            <h1 className="text-h3 font-display text-white">{order.orderNumber}</h1>
            <p className="mt-1 text-caption text-white/35">{formatDateTime(order.createdAt)}</p>
            <p className="mt-1 text-caption text-white/40">
              {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
          <span className={cn("rounded-pill px-3 py-1 text-caption", ORDER_STATUS_COLOR[order.status])}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>

        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.label} className={cn("rounded-xl border px-3 py-3", step.done ? "border-state-success/25 bg-state-success/5" : "border-white/10")}>
              <p className="text-caption font-medium text-white/80">{step.label}</p>
              <p className="mt-1 text-[11px] text-white/35">{step.at ? formatDateTime(step.at) : "Chưa tới"}</p>
            </li>
          ))}
        </ol>

        <ul className="flex flex-col divide-y divide-white/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/san-pham/${item.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="text-caption text-white/35">Số lượng: {item.quantity}</p>
                {item.licenseKey ? (
                  <button
                    type="button"
                    onClick={() => copyKey(item.licenseKey as string)}
                    className="mt-1 inline-flex items-center gap-1.5 text-caption text-accent-orange"
                  >
                    {copied === item.licenseKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {item.licenseKey}
                  </button>
                ) : null}
              </div>
              {order.status === "PAID" && (
                <Button variant="secondary" className="px-3 py-1.5 text-caption" onClick={() => handleDownload(item.id)}>
                  <Download className="h-3.5 w-3.5" /> Tải xuống
                </Button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-small">
          <div className="flex justify-between text-white/60">
            <span>Tạm tính</span>
            <span>{formatVnd(order.subtotal)}</span>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between text-accent-orange">
              <span>Giảm giá {order.coupon ? `(${order.coupon.code})` : ""}</span>
              <span>-{formatVnd(order.discountTotal)}</span>
            </div>
          )}
          {Number(order.taxTotal) > 0 && (
            <div className="flex justify-between text-white/60">
              <span>Thuế</span>
              <span>{formatVnd(order.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 text-title font-semibold text-white">
            <span>Tổng cộng</span>
            <span>{formatVnd(order.total)}</span>
          </div>
        </div>

        {order.paymentNote ? <p className="mt-4 text-caption text-white/40">Ghi chú chuyển khoản: {order.paymentNote}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => window.print()}>In biên nhận</Button>
          <Link href="/ho-tro" className="flex items-center gap-2 text-caption text-white/40 hover:text-white/70">
            <LifeBuoy className="h-3.5 w-3.5" /> Cần hỗ trợ hoặc yêu cầu hoàn tiền?
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
