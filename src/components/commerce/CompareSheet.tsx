"use client";

import Link from "next/link";
import { useCompare } from "@/components/commerce/CompareProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatVnd } from "@/lib/format";

const ROWS = [
  { key: "price", label: "Giá", value: (item: { price: number; discountPrice?: number | null }) => formatVnd(item.discountPrice ?? item.price) },
  { key: "version", label: "Phiên bản", value: (item: { version?: string | null }) => item.version || "—" },
  { key: "license", label: "Giấy phép", value: (item: { licenseType?: string | null }) => item.licenseType || "Theo đơn hàng" },
  { key: "compat", label: "Tương thích", value: (item: { compatibility?: string | null }) => item.compatibility || "—" },
  { key: "size", label: "Dung lượng", value: (item: { fileSizeMb?: number | null }) => (item.fileSizeMb ? `${item.fileSizeMb} MB` : "—") },
  { key: "delivery", label: "Giao hàng", value: () => "Tức thì sau thanh toán" },
  { key: "rating", label: "Đánh giá", value: (item: { averageRating?: number; reviewCount?: number }) => (item.reviewCount ? `${(item.averageRating ?? 0).toFixed(1)} · ${item.reviewCount}` : "Chưa có") }
] as const;

export function CompareSheet({
  open,
  onClose,
  onRemove
}: {
  open: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const { items } = useCompare();

  return (
    <BottomSheet open={open} title="So sánh sản phẩm" onClose={onClose}>
      {items.length < 2 ? (
        <p className="pb-6 text-small text-white/50">Chọn thêm sản phẩm để so sánh. Tối đa 4 sản phẩm.</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <table className="min-w-[640px] w-full text-left text-small">
            <thead>
              <tr>
                <th className="w-32 p-2 text-caption text-white/35">Tiêu chí</th>
                {items.map((item) => (
                  <th key={item.id} className="p-2">
                    <div className="relative mb-2 h-16 w-full overflow-hidden rounded-xl bg-white/5">
                      <SafeImage src={item.thumbnailUrl} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                    <Link href={`/san-pham/${item.slug}`} className="line-clamp-2 text-white hover:text-accent-orange">{item.name}</Link>
                    <button type="button" onClick={() => onRemove(item.id)} className="mt-1 text-[11px] text-white/35 hover:text-white">
                      Bỏ
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-t border-white/[.06]">
                  <td className="p-2 text-white/40">{row.label}</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-2 text-white/80">
                      {row.value(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BottomSheet>
  );
}
