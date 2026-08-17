"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useTicket, useReplyTicket } from "@/hooks/useSupportTickets";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, TICKET_STATUS_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useTicket(params.id);
  const reply = useReplyTicket(params.id);
  const { show } = useToast();
  const [message, setMessage] = useState("");

  if (isLoading) return <LoadingBlock />;
  if (!data) {
    return (
      <EmptyState
        title="Không tìm thấy yêu cầu hỗ trợ"
        description="Yêu cầu hỗ trợ này không tồn tại hoặc bạn không có quyền xem."
        actionLabel="Xem yêu cầu của tôi"
        actionHref="/ho-tro"
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.push("/ho-tro")} className="flex w-fit items-center gap-2 text-small text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-display text-white">{ticket.subject}</h1>
        <span className="rounded-pill bg-white/5 px-3 py-1 text-caption text-white/60">{TICKET_STATUS_LABEL[ticket.status]}</span>
      </div>

      <div className="flex flex-col gap-4">
        {ticket.messages.map((m) => {
          const isStaff = m.author.role === "ADMIN" || m.author.role === "SUPER_ADMIN";
          return (
            <div key={m.id} className={cn("flex flex-col", isStaff ? "items-start" : "items-end")}>
              <GlassPanel
                radius="md"
                className={cn("max-w-[80%] p-4", isStaff ? "border-accent-blue/20" : "border-accent-orange/20")}
              >
                <p className="text-small text-white/85 whitespace-pre-wrap">{m.body}</p>
              </GlassPanel>
              <p className="mt-1 text-caption text-white/30">
                {isStaff ? "Đội ngũ hỗ trợ" : m.author.displayName} · {formatDateTime(m.createdAt)}
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
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-accent-orange/70 focus:outline-none"
          />
          <Button onClick={handleSend} isLoading={reply.isPending} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
