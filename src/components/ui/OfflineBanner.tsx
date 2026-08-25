"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = navigator.onLine;
      setOnline((prev) => {
        if (!prev && next) {
          setRestored(true);
          window.setTimeout(() => setRestored(false), 2400);
        }
        return next;
      });
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online && !restored) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[1900] -translate-x-1/2 rounded-full border border-white/10 bg-[#0c1118]/92 px-4 py-2 text-[12px] font-medium text-white/80 shadow-lg backdrop-blur-xl"
    >
      {online ? (
        <span className="inline-flex items-center gap-2 text-state-success">
          <Wifi className="h-3.5 w-3.5" /> Đã kết nối lại
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <WifiOff className="h-3.5 w-3.5 text-accent-orange" /> Bạn đang offline. Một số tính năng trực tuyến tạm thời không khả dụng.
        </span>
      )}
    </div>
  );
}
