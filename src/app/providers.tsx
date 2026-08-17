"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/Toast";
import { MusicProvider } from "@/components/music/MusicProvider";
import { LanguageBridge } from "@/components/preferences/LanguageBridge";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false, refetchOnReconnect: true }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MusicProvider><LanguageBridge />{children}</MusicProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
