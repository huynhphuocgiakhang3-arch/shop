"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useTickets, useCreateTicket } from "@/hooks/useSupportTickets";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import type { TicketStatus } from "@prisma/client";
import { formatDateTime, TICKET_STATUS_LABEL } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<TicketStatus, string> = {
  OPEN: "text-accent-blue bg-accent-blue/10",
  IN_PROGRESS: "text-state-warning bg-state-warning/10",
  RESOLVED: "text-state-success bg-state-success/10",
  CLOSED: "text-white/40 bg-white/5"
};

export default function SupportTicketsPage() {
  const { data, isLoading } = useTickets();
  const createTicket = useCreateTicket();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleCreate = () => {
    if (!subject.trim() || !body.trim()) {
      show("Vui lòng nhập đầy đủ tiêu đề và nội dung.", "error");
      return;
    }
    createTicket.mutate(
      { subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => {
          show("Đã gửi yêu cầu hỗ trợ.", "success");
          setSubject("");
          setBody("");
          setCreating(false);
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Gửi yêu cầu thất bại.", "error")
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-display text-white">Trung tâm hỗ trợ</h1>
        <Button onClick={() => setCreating((c) => !c)}>
          <Plus className="h-4 w-4" /> Tạo yêu cầu mới
        </Button>
      </div>

      {creating && (
        <GlassPanel radius="md" className="p-6">
          <Input label="Tiêu đề" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Vấn đề của bạn là gì?" />
          <div className="mt-4">
            <label className="mb-2 block text-small text-white/70">Nội dung</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-accent-orange/70 focus:outline-none"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            />
          </div>
          <Button className="mt-4" onClick={handleCreate} isLoading={createTicket.isPending}>
            Gửi yêu cầu
          </Button>
        </GlassPanel>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có yêu cầu hỗ trợ" description="Mọi thắc mắc của bạn sẽ được xử lý tại đây." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((ticket) => (
            <Link key={ticket.id} href={`/ho-tro/${ticket.id}`}>
              <GlassPanel radius="md" className="flex items-center justify-between p-5 hover:border-white/20">
                <div>
                  <p className="text-small text-white/85">{ticket.subject}</p>
                  <p className="text-caption text-white/35">{formatDateTime(ticket.updatedAt)} · {ticket._count.messages} tin nhắn</p>
                </div>
                <span className={cn("rounded-pill px-3 py-1 text-caption", STATUS_COLOR[ticket.status])}>
                  {TICKET_STATUS_LABEL[ticket.status]}
                </span>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
