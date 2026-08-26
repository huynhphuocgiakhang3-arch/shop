"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ShoppingBag, Bookmark } from "lucide-react";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useApplyCoupon,
  useRemoveCoupon,
  useToggleSaveForLater
} from "@/hooks/useCart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd } from "@/lib/format";
import { ApiError } from "@/lib/api-client";

export default function CartPage() {
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const saveForLater = useToggleSaveForLater();
  const { show } = useToast();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");

  if (isLoading) return <LoadingBlock />;

  const items = data?.cart.items.filter((i) => !i.savedForLater) ?? [];
  const saved = data?.cart.items.filter((i) => i.savedForLater) ?? [];
  const summary = data?.summary;

  if (items.length === 0 && saved.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng của bạn đang trống"
        description="Hãy khám phá marketplace và thêm sản phẩm bạn thích vào giỏ hàng."
        actionLabel="Khám phá sản phẩm"
        actionHref="/san-pham"
      />
    );
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    applyCoupon.mutate(couponCode.trim(), {
      onSuccess: () => {
        show("Áp dụng mã giảm giá thành công.", "success");
        setCouponCode("");
      },
      onError: (err) => show(err instanceof ApiError ? err.message : "Mã giảm giá không hợp lệ.", "error")
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 font-display text-white">Giỏ hàng ({summary?.itemCount ?? 0})</h1>

        {items.map((item) => {
          const unitPrice = Number(item.product.discountPrice ?? item.product.price);
          return (
            <GlassPanel key={item.id} radius="md" className="flex items-center gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-white/5">
                <Image src={item.product.thumbnailUrl} alt={item.product.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/san-pham/${item.product.slug}`} className="text-small text-white/85 hover:text-white line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="mt-1 text-small font-semibold text-accent-orange">{formatVnd(unitPrice)}</p>
              </div>

              <div className="flex items-center gap-2 rounded-pill border border-white/10 px-1">
                <button
                  onClick={() => updateItem.mutate({ id: item.id, quantity: Math.max(0, item.quantity - 1) })}
                  className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center text-small text-white">{item.quantity}</span>
                <button
                  onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                  className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => saveForLater.mutate(item.id, { onSuccess: () => show("Đã lưu để mua sau.", "success") })}
                className="text-white/30 hover:text-white"
                aria-label="Lưu mua sau"
                title="Lưu mua sau"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeItem.mutate(item.id)}
                className="text-white/30 hover:text-state-danger"
                aria-label="Xóa khỏi giỏ hàng"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassPanel>
          );
        })}
      </div>

      <GlassPanel radius="md" className="h-fit p-6">
        <h2 className="mb-4 text-title text-white">Tóm tắt đơn hàng</h2>

        <div className="mb-4 flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Mã giảm giá"
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleApplyCoupon} isLoading={applyCoupon.isPending}>
            Áp dụng
          </Button>
        </div>

        {data?.cart.coupon && (
          <div className="mb-4 flex items-center justify-between rounded-md bg-accent-orange/10 px-3 py-2 text-caption text-accent-orange">
            <span>Mã: {data.cart.coupon.code}</span>
            <button onClick={() => removeCoupon.mutate()} className="hover:underline">
              Gỡ bỏ
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-small">
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
          {summary && summary.taxTotal > 0 && (
            <div className="flex justify-between text-white/60">
              <span>Thuế</span>
              <span>{formatVnd(summary.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 text-title font-semibold text-white">
            <span>Tổng cộng</span>
            <span>{formatVnd(summary?.total ?? 0)}</span>
          </div>
        </div>

        <Button className="mt-5 w-full" onClick={() => router.push("/thanh-toan")} disabled={items.length === 0}>
          <ShoppingBag className="h-4 w-4" /> Tiến hành thanh toán
        </Button>
      </GlassPanel>

      {saved.length > 0 ? (
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-title text-white">Mua sau</h2>
          <div className="grid gap-3">
            {saved.map((item) => (
              <GlassPanel key={item.id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white/5">
                  <Image src={item.product.thumbnailUrl} alt={item.product.name} fill className="object-cover" />
                </div>
                <Link href={`/san-pham/${item.product.slug}`} className="min-w-0 flex-1 truncate text-small text-white/80">
                  {item.product.name}
                </Link>
                <Button variant="secondary" onClick={() => saveForLater.mutate(item.id)}>Đưa lại vào giỏ</Button>
              </GlassPanel>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
