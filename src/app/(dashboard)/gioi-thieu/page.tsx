"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, UserCheck, Wallet, Copy, Check, Share2, Gift } from "lucide-react";
import { useReferralMe } from "@/hooks/useReferral";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { StatCard, EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ReferralPage() {
  const { data, isLoading } = useReferralMe();
  const { show } = useToast();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <EmptyState title="Không thể tải chương trình giới thiệu" description="Đã có lỗi khi tải dữ liệu. Vui lòng tải lại trang." />;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://khanghuynhvault.vercel.app";
  const referralLink = `${origin}/dang-ky?ref=${data.referralCode}`;

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      show(which === "code" ? "Đã sao chép mã giới thiệu." : "Đã sao chép link giới thiệu.", "success");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      show("Không thể sao chép. Vui lòng thử lại.", "error");
    }
  };

  const share = async () => {
    const shareData = { title: "KhangHuynh Vault", text: `Tham gia KhangHuynh Vault cùng mình, dùng mã ${data.referralCode} nhé!`, url: referralLink };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      copy(referralLink, "link");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Giới thiệu bạn bè</h1>
        <p className="mt-1 text-small text-white/50">
          {data.enabled
            ? `Mời bạn bè bằng link riêng của bạn — nhận ${data.commissionPercent}% giá trị đơn hàng đầu tiên của mỗi người, cộng thẳng vào Wallet.`
            : "Chương trình giới thiệu hiện đang tạm ngưng."}
        </p>
      </div>

      {/* Hero: code + link */}
      <GlassPanel radius="xl" className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-orange/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-orange/25 to-accent-orange/5 text-accent-orange">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-caption uppercase tracking-[.14em] text-white/35">Mã giới thiệu của bạn</p>
              <p className="mt-1 font-mono text-[28px] font-bold tracking-[.08em] text-white sm:text-[34px]">{data.referralCode}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="khv-touch-target" onClick={() => copy(data.referralCode, "code")}>
              {copied === "code" ? <Check className="h-4 w-4 text-state-success" /> : <Copy className="h-4 w-4" />} Sao chép mã
            </Button>
            <Button className="khv-touch-target" onClick={share}>
              <Share2 className="h-4 w-4" /> Chia sẻ link
            </Button>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-small text-white/60">{referralLink}</p>
          <button
            onClick={() => copy(referralLink, "link")}
            className="khv-touch-target flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-caption font-semibold text-accent-orange hover:bg-accent-orange/10"
          >
            {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </button>
        </div>
      </GlassPanel>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Đã mời" value={String(data.stats.totalReferred)} />
        <StatCard icon={UserCheck} label="Đã mua hàng" value={String(data.stats.totalConverted)} />
        <StatCard icon={Wallet} label="Tổng hoa hồng nhận được" value={formatVnd(data.stats.totalCommission)} />
      </div>

      {/* Referred friends */}
      <GlassPanel radius="md" className="p-5 sm:p-6">
        <h2 className="mb-4 text-title text-white">Bạn bè đã mời ({data.referredUsers.length})</h2>
        {data.referredUsers.length === 0 ? (
          <EmptyState
            title="Chưa có ai dùng link của bạn"
            description="Chia sẻ mã hoặc link giới thiệu ở trên — mỗi người bạn mời mua hàng lần đầu, bạn nhận ngay hoa hồng vào Wallet."
          />
        ) : (
          <div className="flex flex-col divide-y divide-white/[.06]">
            {data.referredUsers.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/5">
                  {r.avatarUrl ? (
                    <Image src={r.avatarUrl} alt={r.displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-small font-semibold text-white/40">
                      {r.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small text-white/85">{r.displayName}</p>
                  <p className="text-caption text-white/35">Tham gia {formatDate(r.createdAt)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                    r.hasPurchased ? "bg-state-success/15 text-state-success" : "bg-white/[.06] text-white/35"
                  )}
                >
                  {r.hasPurchased ? "Đã mua hàng" : "Chưa mua hàng"}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
