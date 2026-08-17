"use client";
import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

type Announcement = { id: string; title: string; body: string };

const DISMISS_KEY = "khv-dismissed-announcement";

// Mirrors FAQSection's pattern: a lightweight fetch-on-mount for public,
// unauthenticated content rather than pulling in react-query for a single
// read that never needs cache invalidation from elsewhere in the app.
export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until we know there's something to show

  useEffect(() => {
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { announcements?: Announcement[] } | null) => {
        const latest = data?.announcements?.[0];
        if (!latest) return;
        setAnnouncement(latest);
        const dismissedId = typeof window !== "undefined" ? window.localStorage.getItem(DISMISS_KEY) : null;
        setDismissed(dismissedId === latest.id);
      })
      .catch(() => undefined);
  }, []);

  if (!announcement || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, announcement.id);
  };

  return (
    <div className="relative flex items-center gap-3 border-b border-accent-orange/15 bg-accent-orange/[0.08] px-4 py-2.5 text-center sm:px-8">
      <Megaphone className="hidden h-4 w-4 shrink-0 text-accent-orange sm:block" aria-hidden="true" />
      <p className="mx-auto min-w-0 max-w-4xl text-caption text-white/80">
        <span className="font-semibold text-accent-orange">{announcement.title}</span>
        {announcement.body ? <span className="text-white/60"> — {announcement.body}</span> : null}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Đóng thông báo"
        className="khv-touch-target flex shrink-0 items-center justify-center text-white/40 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
