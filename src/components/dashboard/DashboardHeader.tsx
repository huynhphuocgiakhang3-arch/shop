"use client";

import Link from "next/link";
import { DisplayControls } from "@/components/preferences/DisplayControls";
import { Bell } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useNotifications } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useProfile";
import { formatVnd } from "@/lib/format";

export function DashboardHeader() {
  const { data: walletData } = useWallet();
  const { data: notifData } = useNotifications();
  const { data: userData } = useCurrentUser();

  return (
    <header className="khv-dashboard-header glass-surface sticky top-0 z-20 flex min-h-[68px] items-center justify-between rounded-none border-x-0 border-t-0 px-3 py-2 sm:h-[72px] sm:px-6">
      <div />
      <div className="flex items-center gap-1.5 sm:gap-3"><DisplayControls compact />
        {walletData && (
          <Link href="/vi" className="rounded-pill border border-white/10 bg-white/[0.03] px-4 py-1.5 text-small text-white/70 hover:border-accent-orange/40">
            {formatVnd(walletData.wallet.balance)}
          </Link>
        )}

        <Link href="/thong-bao" className="relative text-white/60 hover:text-white" aria-label="Thông báo">
          <Bell className="h-5 w-5" />
          {notifData && notifData.unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-semibold text-black">
              {notifData.unreadCount > 9 ? "9+" : notifData.unreadCount}
            </span>
          )}
        </Link>

        <Link href="/ho-so" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-small font-semibold text-white/80">
            {userData?.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userData.user.avatarUrl} alt={userData.user.displayName} className="h-full w-full object-cover" />
            ) : (
              userData?.user.displayName?.charAt(0)?.toUpperCase() ?? "?"
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
