"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, LifeBuoy, ArrowLeft } from "lucide-react";
import { useOrder } from "@/hooks/useOrders";
import { useGenerateDownload } from "@/hooks/useDownloads";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useOrder(params.id);
  const generateDownload = useGenerateDownload();
  const { show } = useToast();

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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.push("/don-hang")} className="flex w-fit items-center gap-2 text-small text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <GlassPanel radius="lg" className="p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-caption text-white/40">Mã đơn hàng</p>
            <h1 className="text-h3 font-display text-white">{order.orderNumber}</h1>
            <p className="mt-1 text-caption text-white/35">{formatDateTime(order.createdAt)}</p>
          </div>
          <span className={cn("rounded-pill px-3 py-1 text-caption", ORDER_STATUS_COLOR[order.status])}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>

        <ul className="flex flex-col divide-y divide-white/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <Link href={`/san-pham/${item.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-caption text-white/35">Số lượng: {item.quantity}</p>
                </div>
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

        <Link href="/ho-tro" className="mt-6 flex items-center gap-2 text-caption text-white/40 hover:text-white/70">
          <LifeBuoy className="h-3.5 w-3.5" /> Cần hỗ trợ hoặc yêu cầu hoàn tiền cho đơn hàng này?
        </Link>
      </GlassPanel>
    </div>
  );
}
