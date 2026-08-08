"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, QrCode, CreditCard } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { formatVnd, formatDateTime } from "@/lib/format";
import { useAdminDeposits, useApproveDeposit, useRejectDeposit, type AdminDepositItem } from "@/hooks/admin/useAdminDeposits";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TABS: { key: "PENDING" | "APPROVED" | "REJECTED"; label: string }[] = [
  { key: "PENDING", label: "Đang chờ" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" }
];

export default function AdminDepositsPage() {
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const { data, isLoading } = useAdminDeposits(tab);
  const approve = useApproveDeposit();
  const reject = useRejectDeposit();
  const { show } = useToast();

  const [rejectTarget, setRejectTarget] = useState<AdminDepositItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const items = data?.items ?? [];

  const handleApprove = (item: AdminDepositItem) => {
    approve.mutate(item.id, {
      onSuccess: () => show(`Đã duyệt và cộng ${formatVnd(item.amount)} cho ${item.user.displayName}.`, "success"),
      onError: (err) => show(err instanceof ApiError ? err.message : "Duyệt thất bại.", "error")
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    reject.mutate(
      { id: rejectTarget.id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          show("Đã từ chối yêu cầu.", "success");
          setRejectTarget(null);
          setRejectReason("");
        },
        onError: (err) => show(err instanceof ApiError ? err.message : "Có lỗi xảy ra.", "error")
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Yêu cầu nạp tiền</h1>
        <p className="mt-1 text-small text-white/50">Duyệt sẽ tự động cộng tiền vào ví người dùng.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-pill px-4 py-2 text-small font-medium transition-colors duration-standard",
              tab === t.key ? "bg-accent-orange text-black" : "glass-surface text-white/60 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào" description="Danh sách sẽ hiện tại đây khi có yêu cầu mới." />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <GlassPanel key={item.id} radius="md" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
                  {item.method === "QR_BANK" ? <QrCode className="h-5 w-5 text-white/50" /> : <CreditCard className="h-5 w-5 text-white/50" />}
                </div>
                <div>
                  <p className="text-small font-medium text-white/90">{item.user.displayName}</p>
                  <p className="text-caption text-white/40">{item.user.email}</p>
                  <p className="text-caption text-white/35">{formatDateTime(item.createdAt)} · IP {item.ipAddress ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-title font-display text-white">{formatVnd(item.amount)}</p>

                {item.method === "QR_BANK" && item.proofImageUrl && (
                  <button
                    onClick={() => setProofPreview(item.proofImageUrl)}
                    className="relative h-14 w-14 overflow-hidden rounded-md border border-white/10"
                  >
                    <Image src={item.proofImageUrl} alt="Bằng chứng chuyển khoản" fill className="object-cover" />
                  </button>
                )}
                {item.method === "CARD" && item.cardCode && (
                  <code className="rounded-md bg-white/[0.06] px-3 py-2 text-caption text-white/70">{item.cardCode}</code>
                )}

                {tab === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleApprove(item)} isLoading={approve.isPending}>
                      <Check className="h-4 w-4" /> Duyệt
                    </Button>
                    <Button variant="danger" onClick={() => setRejectTarget(item)}>
                      <X className="h-4 w-4" /> Từ chối
                    </Button>
                  </div>
                ) : (
                  <span className={cn("text-caption font-medium", tab === "APPROVED" ? "text-state-success" : "text-state-danger")}>
                    {tab === "APPROVED" ? "Đã cộng tiền" : item.rejectReason ?? "Đã từ chối"}
                  </span>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <Modal open={Boolean(proofPreview)} title="Bằng chứng chuyển khoản" onClose={() => setProofPreview(null)}>
        {proofPreview && (
          <div className="relative h-[420px] w-full overflow-hidden rounded-md">
            <Image src={proofPreview} alt="Bằng chứng chuyển khoản" fill className="object-contain" />
          </div>
        )}
      </Modal>

      <Modal open={Boolean(rejectTarget)} title={`Từ chối yêu cầu — ${rejectTarget?.user.displayName ?? ""}`} onClose={() => setRejectTarget(null)}>
        <div className="flex flex-col gap-4">
          <Input label="Lý do từ chối" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Không tìm thấy giao dịch chuyển khoản" />
          <Button variant="danger" onClick={handleReject} isLoading={reject.isPending}>
            Xác nhận từ chối
          </Button>
        </div>
      </Modal>
    </div>
  );
}
