"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useWallet } from "@/hooks/useWallet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "WALLET", label: "Thanh toán bằng Wallet", icon: Wallet, desc: "Trừ trực tiếp từ số dư đã nạp trong tài khoản và cấp sản phẩm ngay lập tức." }
] as const;

export default function CheckoutPage() {
  const { data: cartData, isLoading } = useCart();
  const { data: walletData } = useWallet();
  const checkout = useCheckout();
  const { show } = useToast();
  const router = useRouter();
  const method = "WALLET" as const;
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  if (isLoading) return <LoadingBlock />;

  const items = cartData?.cart.items.filter((i) => !i.savedForLater) ?? [];
  const summary = cartData?.summary;

  if (items.length === 0 && !success) {
    return (
      <EmptyState
        title="Không có gì để thanh toán"
        description="Giỏ hàng của bạn đang trống."
        actionLabel="Khám phá sản phẩm"
        actionHref="/san-pham"
      />
    );
  }

  const walletBalance = Number(walletData?.wallet.balance ?? 0);
  const insufficientWallet = method === "WALLET" && summary && walletBalance < summary.total;

  const handleConfirm = () => {
    checkout.mutate(undefined, {
      onSuccess: (data) => {
        setSuccess({ orderNumber: data.order.orderNumber });
        show("Đặt hàng thành công!", "success");
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Đặt hàng thất bại.", "error")
    });
  };

  if (success) {
    return (
      <div className="flex justify-center py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassPanel radius="lg" className="flex max-w-md flex-col items-center p-10 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-state-success" />
            <h1 className="mb-2 text-h3 font-display text-white">Đặt hàng thành công</h1>
            <p className="mb-1 text-small text-white/60">Mã đơn hàng của bạn:</p>
            <p className="mb-6 text-title font-semibold text-accent-orange">{success.orderNumber}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push("/don-hang")}>Xem đơn hàng</Button>
              <Button onClick={() => router.push("/tai-xuong")}>Tải xuống ngay</Button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-display text-white">Thanh toán</h1>

        <GlassPanel radius="md" className="p-6">
          <h2 className="mb-4 text-title text-white">Phương thức thanh toán</h2>
          <div className="flex flex-col gap-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    "flex items-start gap-4 rounded-md border p-4 text-left transition-colors duration-standard",
                    active ? "border-accent-orange/60 bg-accent-orange/5" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-accent-orange" : "text-white/50")} />
                  <div>
                    <p className="text-small font-medium text-white/90">{m.label}</p>
                    <p className="text-caption text-white/40">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {method === "WALLET" && (
            <p className="mt-4 text-caption text-white/40">
              Số dư Wallet khả dụng: <span className="text-white/70">{formatVnd(walletBalance)}</span>
            </p>
          )}
          {insufficientWallet && (
            <p className="mt-2 text-caption text-state-danger">Số dư Wallet không đủ. Vui lòng nạp thêm tiền trước khi mua.</p>
          )}
          {insufficientWallet && <a href="/nap-tien" className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-accent-orange hover:underline">Nạp tiền vào Wallet <ArrowUpRight className="h-3.5 w-3.5" /></a>}
        </GlassPanel>

        <GlassPanel radius="md" className="p-6">
          <h2 className="mb-3 text-title text-white">Sản phẩm ({items.length})</h2>
          <ul className="flex flex-col divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-small text-white/70">
                <span className="line-clamp-1">{item.product.name} × {item.quantity}</span>
                <span>{formatVnd(Number(item.product.discountPrice ?? item.product.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel radius="md" className="h-fit p-6">
        <h2 className="mb-4 text-title text-white">Tổng thanh toán</h2>
        <div className="flex flex-col gap-2 text-small">
          <div className="flex justify-between text-white/60">
            <span>Tạm tính</span>
            <span>{formatVnd(summary?.subtotal ?? 0)}</span>
          </div>
          {summary && summary.discountTotal > 0 && (
            <div className="flex justify-between text-accent-orange">
              <span>Giảm giá</span>
              <span>-{formatVnd(summary.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 text-title font-semibold text-white">
            <span>Tổng cộng</span>
            <span>{formatVnd(summary?.total ?? 0)}</span>
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          onClick={handleConfirm}
          isLoading={checkout.isPending}
          disabled={Boolean(insufficientWallet)}
        >
          Xác nhận đặt hàng
        </Button>
      </GlassPanel>
    </div>
  );
}
