"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, ShieldCheck, Bot, ArrowLeft } from "lucide-react";
import { useConversation, useSendMessage, useMarkChatRead, type ChatMessageItem } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "A").trim().charAt(0).toUpperCase();

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("h-full w-full rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-accent-orange/15 text-accent-orange", className)}>
      <span className="text-[11px] font-semibold">{initial}</span>
    </div>
  );
}

function Bubble({ message, adminName, adminAvatar }: { message: ChatMessageItem; adminName: string; adminAvatar: string | null }) {
  const isUser = message.sender === "USER";
  const isAdmin = message.sender === "ADMIN";

  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
          {isAdmin ? (
            <Avatar src={adminAvatar} name={adminName} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white/[0.08]">
              <Bot className="h-3.5 w-3.5 text-white/50" />
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          "max-w-[220px] shrink-0 whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-small shadow-sm",
          isUser ? "bg-accent-orange text-black" : "glass-surface text-white/85"
        )}
      >
        {isAdmin && <p className="mb-1 text-[10px] font-medium text-accent-orange">{adminName}</p>}
        {message.body}
        {message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[11px] underline opacity-80">
            Xem tệp đính kèm
          </a>
        )}
        <p className={cn("mt-1 text-[10px]", isUser ? "text-black/50" : "text-white/30")}>{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

function ChatRoom({ onBack }: { onBack: () => void }) {
  const { data } = useConversation(true);
  const send = useSendMessage();
  const markRead = useMarkChatRead();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];
  const admin = data?.admin ?? { displayName: "AD.Khanghuynh", avatarUrl: null };
  const adminName = admin.displayName || "AD.Khanghuynh";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const value = text.trim();
    if (!value || send.isPending) return;
    setText("");
    send.mutate({ body: value });
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <button onClick={onBack} className="text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
          <Avatar src={admin.avatarUrl} name={adminName} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-white/95">{adminName}</p>
          <p className="flex items-center gap-1 text-[11px] text-state-success">
            <span className="h-1.5 w-1.5 rounded-full bg-state-success" /> Super Admin • Online
          </p>
        </div>
        <ShieldCheck className="h-4 w-4 text-accent-orange/80" />
      </div>

      <div ref={scrollRef} className="flex h-72 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <Bubble key={m.id} message={m} adminName={adminName} adminAvatar={admin.avatarUrl} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-pill bg-white/[0.06] px-4 py-2 text-small text-white/90 outline-none placeholder:text-white/30 focus:bg-white/[0.09]"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange text-black disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="glass-surface absolute bottom-16 right-0 flex w-80 max-w-[calc(100vw-2rem)] shrink-0 flex-col overflow-hidden rounded-lg border border-white/10 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-end px-3 pt-2">
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ChatRoom onBack={onClose} />
    </motion.div>
  );
}
