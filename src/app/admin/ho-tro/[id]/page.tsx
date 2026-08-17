"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useTicket, useReplyTicket, useUpdateTicketStatus } from "@/hooks/useSupportTickets";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, TICKET_STATUS_LABEL, TICKET_PRIORITY_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useTicket(params.id);
  const reply = useReplyTicket(params.id);
  const updateStatus = useUpdateTicketStatus(params.id);
  const { show } = useToast();
  const [message, setMessage] = useState("");

  if (isLoading) return <LoadingBlock />;
  if (!data) {
    return (
      <EmptyState
        title="Không tìm thấy yêu cầu hỗ trợ"
        description="Yêu cầu hỗ trợ này không tồn tại."
        actionLabel="Xem tất cả yêu cầu"
        actionHref="/admin/ho-tro"
      />
    );
  }

  const { ticket } = data;

  const handleSend = () => {
    if (!message.trim()) return;
    reply.mutate(message.trim(), {
      onSuccess: () => setMessage(""),
      onError: (err) => show(err instanceof ApiError ? err.message : "Gửi tin nhắn thất bại.", "error")
    });
  };

  const handleStatusChange = (status: string) => {
    updateStatus.mutate(
      { status },
      {
        onSuccess: () => show("Đã cập nhật trạng thái.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể cập nhật trạng thái.", "error")
      }
    );
  };

  const handlePriorityChange = (priority: string) => {
    updateStatus.mutate(
      { priority },
      {
        onSuccess: () => show("Đã cập nhật mức độ ưu tiên.", "success"),
        onError: (err) => show(err instanceof ApiError ? err.message : "Không thể cập nhật mức độ.", "error")
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <button onClick={() => router.push("/admin/ho-tro")} className="khv-touch-target flex w-fit items-center gap-2 text-small text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div>
        <h1 className="text-h3 font-display text-white">{ticket.subject}</h1>
        <p className="mt-1 text-small text-white/45">
          {ticket.user.displayName} · {ticket.user.email}
        </p>
      </div>

      <GlassPanel radius="md" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-caption text-white/40">Trạng thái</span>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={updateStatus.isPending}
                className={cn(
                  "khv-touch-target rounded-pill border px-3 py-1.5 text-caption transition-colors disabled:opacity-50",
                  ticket.status === s ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
                )}
              >
                {TICKET_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-white/40">Mức độ ưu tiên</span>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePriorityChange(p)}
                disabled={updateStatus.isPending}
                className={cn(
                  "khv-touch-target rounded-pill border px-3 py-1.5 text-caption transition-colors disabled:opacity-50",
                  ticket.priority === p ? "border-accent-orange/60 bg-accent-orange/10 text-accent-orange" : "border-white/10 text-white/50 hover:text-white/80"
                )}
              >
                {TICKET_PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="flex flex-col gap-4">
        {ticket.messages.map((m) => {
          const isStaff = m.author.role === "ADMIN" || m.author.role === "SUPER_ADMIN";
          return (
            <div key={m.id} className={cn("flex flex-col", isStaff ? "items-end" : "items-start")}>
              <GlassPanel radius="md" className={cn("max-w-[80%] p-4", isStaff ? "border-accent-orange/20" : "border-accent-blue/20")}>
                <p className="whitespace-pre-wrap text-small text-white/85">{m.body}</p>
              </GlassPanel>
              <p className="mt-1 text-caption text-white/30">
                {isStaff ? "Bạn (đội ngũ hỗ trợ)" : m.author.displayName} · {formatDateTime(m.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      {ticket.status !== "CLOSED" && (
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Trả lời khách hàng..."
            className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-accent-orange/70 focus:outline-none"
          />
          <Button onClick={handleSend} isLoading={reply.isPending} className="khv-touch-target self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
