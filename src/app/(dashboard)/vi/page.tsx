"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Lock } from "lucide-react";
import { useWallet, useWalletTransactions, useWalletWithdraw } from "@/hooks/useWallet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDateTime, WALLET_TX_LABEL, WALLET_TX_STATUS_LABEL, isCredit } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const { data: walletData, isLoading } = useWallet();
  const { data: txData, fetchNextPage, hasNextPage } = useWalletTransactions();
  const withdraw = useWalletWithdraw();
  const { show } = useToast();

  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState("");

  if (isLoading) return <LoadingBlock />;

  const transactions = txData?.pages.flatMap((p) => p.items) ?? [];
  const frozen = walletData?.wallet.frozen ?? false;

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      show("Vui lòng nhập số tiền hợp lệ.", "error");
      return;
    }
    withdraw.mutate(
      { amount: value },
      {
        onSuccess: () => {
          show("Yêu cầu rút tiền đã được ghi nhận.", "success");
          setAmount("");
          setWithdrawing(false);
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h2 font-display text-white">Ví của tôi</h1>

      {frozen && (
        <GlassPanel radius="md" className="flex items-center gap-3 border-state-danger/30 bg-state-danger/10 p-4">
          <Lock className="h-5 w-5 shrink-0 text-state-danger" />
          <p className="text-small text-white/80">
            Ví của bạn đang bị tạm khóa{walletData?.wallet.frozenReason ? ` — ${walletData.wallet.frozenReason}` : ""}. Vui lòng liên hệ Admin để được hỗ trợ.
          </p>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <GlassPanel radius="md" className="p-6">
          <p className="text-caption text-white/40">Số dư khả dụng</p>
          <p className="mt-2 text-h2 font-display text-white">{formatVnd(walletData?.wallet.balance ?? 0)}</p>
        </GlassPanel>
        <GlassPanel radius="md" className="p-6">
          <p className="text-caption text-white/40">Đang chờ xử lý</p>
          <p className="mt-2 text-h3 font-display text-white/70">{formatVnd(walletData?.wallet.pendingBalance ?? 0)}</p>
        </GlassPanel>
        <GlassPanel radius="md" className="p-6">
          <p className="text-caption text-white/40">Số dư thưởng</p>
          <p className="mt-2 text-h3 font-display text-white/70">{formatVnd(walletData?.wallet.bonusBalance ?? 0)}</p>
        </GlassPanel>
      </div>

      <div className="flex gap-3">
        <Link href="/nap-tien">
          <Button disabled={frozen}>
            <ArrowDownCircle className="h-4 w-4" /> Nạp tiền
          </Button>
        </Link>
        <Button variant="secondary" onClick={() => setWithdrawing(true)} disabled={frozen}>
          <ArrowUpCircle className="h-4 w-4" /> Rút tiền
        </Button>
      </div>

      {withdrawing && (
        <GlassPanel radius="md" className="max-w-sm p-6">
          <h2 className="mb-4 text-title text-white">Yêu cầu rút tiền</h2>
          <Input
            label="Số tiền (VND)"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500000"
          />
          <div className="mt-4 flex gap-3">
            <Button onClick={handleSubmit} isLoading={withdraw.isPending}>
              Xác nhận
            </Button>
            <Button variant="ghost" onClick={() => setWithdrawing(false)}>
              Hủy
            </Button>
          </div>
          <p className="mt-3 text-caption text-white/35">Số tiền sẽ được giữ lại chờ quản trị viên duyệt.</p>
        </GlassPanel>
      )}

      <GlassPanel radius="md" className="p-6">
        <h2 className="mb-4 text-title text-white">Lịch sử giao dịch</h2>
        {transactions.length === 0 ? (
          <EmptyState title="Chưa có giao dịch nào" description="Lịch sử nạp/rút/thanh toán sẽ hiện tại đây." />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-white/5">
              {transactions.map((tx) => {
                const credit = isCredit(tx.type);
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-small text-white/80">{WALLET_TX_LABEL[tx.type]}</p>
                      <p className="text-caption text-white/35">{formatDateTime(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-small font-medium", credit ? "text-state-success" : "text-white/80")}>
                        {credit ? "+" : "-"}
                        {formatVnd(tx.amount)}
                      </p>
                      <p className="text-caption text-white/35">{WALLET_TX_STATUS_LABEL[tx.status]}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {hasNextPage && (
              <button onClick={() => fetchNextPage()} className="mt-4 text-caption text-accent-orange/90 hover:text-accent-orange">
                Tải thêm
              </button>
            )}
          </>
        )}
      </GlassPanel>
    </div>
  );
}
