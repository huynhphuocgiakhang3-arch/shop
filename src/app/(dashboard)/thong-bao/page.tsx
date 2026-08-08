"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isLoading) return <LoadingBlock />;

  const notifications = data?.notifications ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-display text-white">Thông báo</h1>
        {Boolean(data?.unreadCount) && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-caption text-accent-orange/90 hover:text-accent-orange"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Không có thông báo" description="Thông báo mới của bạn sẽ xuất hiện tại đây." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <GlassPanel
              key={n.id}
              radius="md"
              className={cn("flex items-start gap-4 p-4 transition-colors", !n.isRead && "border-accent-orange/30")}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
            >
              <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", n.isRead ? "text-white/20" : "text-accent-orange")} />
              <div className="min-w-0 flex-1">
                <p className="text-small text-white/85">{n.title}</p>
                <p className="mt-0.5 text-small text-white/45">{n.body}</p>
                <p className="mt-1.5 text-caption text-white/30">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-orange" />}
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
