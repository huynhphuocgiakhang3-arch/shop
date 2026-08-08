"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Settings, ShieldCheck, Bot, AlertCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import {
  useAdminConversations,
  useAdminConversation,
  useAdminReply,
  useChatSettings,
  useUpdateChatSettings
} from "@/hooks/admin/useAdminChat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

function GreetingSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useChatSettings();
  const update = useUpdateChatSettings();
  const { show } = useToast();
  const [text, setText] = useState("");

  useEffect(() => {
    if (data?.settings.greetingMessage) setText(data.settings.greetingMessage);
  }, [data?.settings.greetingMessage]);

  const handleSave = async () => {
    try {
      await update.mutateAsync(text);
      show("Đã lưu tin nhắn chào mừng.", "success");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu tin nhắn chào mừng.";
      show(message, "error");
    }
  };

  return (
    <Modal open={open} title="Tin nhắn chào mừng tự động" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-caption text-white/40">
          Dùng <code className="rounded bg-white/10 px-1">{"{name}"}</code> để chèn tên người dùng. Gửi tự động khi mở phòng chat lần đầu.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-small text-white/85 outline-none focus:border-accent-orange/50"
        />
        <Button onClick={handleSave} isLoading={update.isPending} className="self-end">
          Lưu
        </Button>
      </div>
    </Modal>
  );
}

export default function AdminChatPage() {
  const { data: listData, isLoading: listLoading } = useAdminConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: threadData } = useAdminConversation(selectedId);
  const reply = useAdminReply();
  const [text, setText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = listData?.conversations ?? [];
  const thread = threadData?.conversation;

  useEffect(() => {
    const first = conversations[0];
    if (!selectedId && first) setSelectedId(first.id);
  }, [conversations, selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  const handleSend = () => {
    const value = text.trim();
    if (!value || !selectedId) return;
    setText("");
    reply.mutate({ id: selectedId, body: value });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-display text-white">Tin nhắn</h1>
        <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4" /> Tin nhắn chào mừng
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
        <GlassPanel radius="md" className="flex flex-col overflow-hidden">
          {listLoading ? (
            <LoadingBlock />
          ) : conversations.length === 0 ? (
            <EmptyState title="Chưa có cuộc trò chuyện" description="Tin nhắn từ người dùng sẽ hiện tại đây." />
          ) : (
            <ul className="flex flex-col divide-y divide-white/5 overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-standard hover:bg-white/[0.03]",
                      selectedId === c.id && "bg-accent-orange/5"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-small text-white/70">
                      {c.user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-small font-medium text-white/90">{c.user.displayName}</p>
                        {c.needsHuman && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-state-warning" />}
                      </div>
                      <p className="truncate text-caption text-white/40">{c.lastMessage?.body ?? ""}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-accent-orange px-1.5 text-[11px] font-semibold text-black">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel radius="md" className="flex min-h-0 flex-col overflow-hidden">
          {!thread ? (
            <div className="flex flex-1 items-center justify-center text-small text-white/30">Chọn một cuộc trò chuyện</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-small text-white/70">
                  {thread.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-small font-medium text-white/90">{thread.user.displayName}</p>
                  <p className="text-caption text-white/40">{thread.user.email}</p>
                </div>
                {thread.needsHuman && (
                  <span className="ml-auto rounded-pill bg-state-warning/10 px-3 py-1 text-caption text-state-warning">Cần hỗ trợ</span>
                )}
              </div>

              <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
                {thread.messages.map((m) => {
                  const isAdmin = m.sender === "ADMIN";
                  return (
                    <div key={m.id} className={cn("flex items-end gap-2", isAdmin ? "justify-end" : "justify-start")}>
                      {!isAdmin && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                          {m.sender === "BOT" ? <Bot className="h-3.5 w-3.5 text-white/50" /> : null}
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] whitespace-pre-line rounded-lg px-3 py-2 text-small",
                          isAdmin ? "bg-accent-orange text-black" : "glass-surface text-white/85"
                        )}
                      >
                        {m.body}
                        <p className={cn("mt-1 text-[10px]", isAdmin ? "text-black/50" : "text-white/30")}>{formatTime(m.createdAt)}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-orange/20">
                          <ShieldCheck className="h-3.5 w-3.5 text-accent-orange" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Nhập phản hồi..."
                  className="flex-1 rounded-pill bg-white/[0.06] px-4 py-2 text-small text-white/90 outline-none placeholder:text-white/30 focus:bg-white/[0.09]"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || reply.isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange text-black disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </GlassPanel>
      </div>

      <GreetingSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
