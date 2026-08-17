"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { useTickets } from "@/hooks/useSupportTickets";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { formatDateTime, TICKET_STATUS_LABEL, TICKET_PRIORITY_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: undefined, label: "Tất cả" },
  { value: "OPEN", label: "Đang mở" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã giải quyết" },
  { value: "CLOSED", label: "Đã đóng" }
] as const;

const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-accent-orange",
  IN_PROGRESS: "bg-blue-400",
  RESOLVED: "bg-state-success",
  CLOSED: "bg-white/30"
};

export default function AdminSupportTicketsPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { data, isLoading } = useTickets(status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Yêu cầu hỗ trợ</h1>
        <p className="mt-2 text-small text-white/45">Xem và trả lời yêu cầu hỗ trợ từ khách hàng.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo trạng thái">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "khv-touch-target rounded-pill border px-4 py-1.5 text-small transition-colors",
              status === tab.value ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <GlassPanel radius="md" className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8">
            <LoadingBlock />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8">
            <EmptyState title="Không có yêu cầu hỗ trợ" description="Chưa có yêu cầu hỗ trợ nào khớp với bộ lọc hiện tại." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-small">
              <thead>
                <tr className="border-b border-white/10 text-caption text-white/40">
                  <th className="px-5 py-4">Chủ đề</th>
                  <th>Khách hàng</th>
                  <th>Mức độ</th>
                  <th>Trạng thái</th>
                  <th>Tin nhắn</th>
                  <th className="px-5">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <Link href={`/admin/ho-tro/${t.id}`} className="flex items-center gap-2 text-white/85 hover:text-accent-orange">
                        <LifeBuoy className="h-4 w-4 shrink-0 text-white/30" /> {t.subject}
                      </Link>
                    </td>
                    <td className="text-white/60">{t.user.displayName}</td>
                    <td className="text-white/60">{TICKET_PRIORITY_LABEL[t.priority]}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-white/70">
                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[t.status])} />
                        {TICKET_STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="text-white/40">{t._count.messages}</td>
                    <td className="px-5 text-white/40">{formatDateTime(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
