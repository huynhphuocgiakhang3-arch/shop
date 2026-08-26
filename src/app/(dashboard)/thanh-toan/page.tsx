"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Wallet, Landmark, CheckCircle2, ArrowUpRight, ShieldCheck, Zap, Clock } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useWallet, usePaymentSettings } from "@/hooks/useWallet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { EASE_PREMIUM } from "@/lib/motion";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "WALLET" as const, label: "Thanh toán bằng ví", icon: Wallet, desc: "Trừ số dư đã nạp. Sản phẩm vào Vault ngay." },
  { id: "BANK_TRANSFER" as const, label: "Chuyển khoản ngân hàng", icon: Landmark, desc: "Đặt đơn trước, Super Admin xác nhận rồi mở Vault." }
];

export default function CheckoutPage() {
  const { data: cartData, isLoading } = useCart();
  const { data: walletData } = useWallet();
  const { data: paymentSettings } = usePaymentSettings();
  const checkout = useCheckout();
  const { show } = useToast();
  const router = useRouter();
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("WALLET");
  const [paymentNote, setPaymentNote] = useState("");
  const [success, setSuccess] = useState<{ orderNumber: string; status: string } | null>(null);

  if (isLoading) return <LoadingBlock />;

  const items = cartData?.cart.items.filter((item) => !item.savedForLater) ?? [];
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
  const bank = paymentSettings?.settings;
  const transferContent = bank?.transferContent ? `${bank.transferContent}` : "KHV";

  const handleConfirm = () => {
    checkout.mutate(
      { paymentMethod: method, paymentNote: paymentNote.trim() || undefined },
      {
        onSuccess: (data) => {
          setSuccess({ orderNumber: data.order.orderNumber, status: data.order.status });
          show(data.order.status === "PAID" ? "Thanh toán thành công." : "Đã tạo đơn chuyển khoản.", "success");
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Đặt hàng thất bại.", "error")
      }
    );
  };

  if (success) {
    const paid = success.status === "PAID";
    return (
      <div className="flex justify-center py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_PREMIUM }}>
          <GlassPanel radius="lg" className="flex max-w-md flex-col items-center p-10 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-full", paid ? "bg-state-success/10" : "bg-state-warning/10")}
            >
              {paid ? <CheckCircle2 className="h-9 w-9 text-state-success" /> : <Clock className="h-9 w-9 text-state-warning" />}
            </motion.div>
            <h1 className="mb-2 text-h3 font-display text-white">{paid ? "Mua hàng thành công" : "Đơn đang chờ xác nhận"}</h1>
            <p className="mb-2 text-small text-white/70">
              {paid ? "Vault của bạn vừa lớn hơn." : "Chuyển khoản đúng số tiền. Vault mở sau khi Super Admin xác nhận."}
            </p>
            <p className="mb-1 text-small text-white/60">Mã đơn hàng:</p>
            <p className="mb-6 text-title font-semibold text-accent-orange">{success.orderNumber}</p>
            <p className="mb-6 flex items-center gap-1.5 text-caption text-white/40">
              {paid ? <Zap className="h-3.5 w-3.5 text-state-success" /> : <Clock className="h-3.5 w-3.5 text-state-warning" />}
              {paid ? "Sản phẩm đã sẵn sàng trong Vault" : "Theo dõi trạng thái ở mục Đơn hàng"}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push("/don-hang")}>Xem đơn hàng</Button>
              <Button onClick={() => router.push(paid ? "/tai-xuong" : "/san-pham")}>{paid ? "Mở Vault" : "Tiếp tục xem"}</Button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_PREMIUM }} className="flex flex-col gap-4">
        <div>
          <p className="text-eyebrow text-accent-orange">Bước cuối</p>
          <h1 className="mt-1 text-h2 font-display text-white">Thanh toán</h1>
        </div>

        <GlassPanel radius="md" className="p-6">
          <h2 className="mb-4 text-title text-white">Phương thức thanh toán</h2>
          <div className="flex flex-col gap-3">
            {METHODS.map((option) => {
              const Icon = option.icon;
              const active = method === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-md border p-4 text-left transition-colors duration-standard",
                    active ? "border-accent-orange/60 bg-accent-orange/5" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-accent-orange" : "text-white/50")} />
                  <div>
                    <p className="text-small font-medium text-white/90">{option.label}</p>
                    <p className="text-caption text-white/40">{option.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {method === "WALLET" && (
            <p className="mt-4 text-caption text-white/40">
              Số dư khả dụng: <span className="text-white/70">{formatVnd(walletBalance)}</span>
            </p>
          )}
          {insufficientWallet && (
            <>
              <p className="mt-2 text-caption text-state-danger">Số dư ví không đủ. Nạp thêm hoặc chọn chuyển khoản.</p>
              <a href="/nap-tien" className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-accent-orange hover:underline">
                Nạp tiền vào ví <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </>
          )}

          {method === "BANK_TRANSFER" && (
            <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-white/[.03] p-4 text-small text-white/70">
              {bank?.bankName ? <p>Ngân hàng: <span className="text-white">{bank.bankName}</span></p> : <p>Super Admin chưa cấu hình ngân hàng. Bạn vẫn có thể đặt đơn và liên hệ hỗ trợ.</p>}
              {bank?.accountName ? <p>Chủ tài khoản: <span className="text-white">{bank.accountName}</span></p> : null}
              {bank?.accountNumber ? <p>Số tài khoản: <span className="text-white">{bank.accountNumber}</span></p> : null}
              <p>Nội dung: <span className="text-accent-orange">{transferContent} {summary ? formatVnd(summary.total) : ""}</span></p>
              <Input
                label="Ghi chú chuyển khoản (tuỳ chọn)"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Tên người chuyển, mã giao dịch..."
              />
            </div>
          )}
        </GlassPanel>

        <GlassPanel radius="md" className="p-6">
          <h2 className="mb-3 text-title text-white">Sản phẩm ({items.length})</h2>
          <ul className="flex flex-col divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/5">
                  <Image src={item.product.thumbnailUrl} alt={item.product.name} fill sizes="48px" className="object-cover" />
                </div>
                <span className="min-w-0 flex-1 truncate text-small text-white/70">{item.product.name} × {item.quantity}</span>
                <span className="shrink-0 text-small text-white/85">{formatVnd(Number(item.product.discountPrice ?? item.product.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08, ease: EASE_PREMIUM }}>
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
            {method === "WALLET" ? "Xác nhận thanh toán" : "Tạo đơn chuyển khoản"}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
            <ShieldCheck className="h-3.5 w-3.5" /> Thanh toán an toàn · Giao hàng số sau khi đơn được xác nhận
          </p>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
