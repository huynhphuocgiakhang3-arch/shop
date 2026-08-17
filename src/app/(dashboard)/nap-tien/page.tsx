"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { QrCode, CreditCard, Copy, Check, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useWallet, useWalletDeposit, useMyDeposits, useUploadDepositProof, usePaymentSettings } from "@/hooks/useWallet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import { useToast } from "@/components/ui/Toast";
import { formatVnd, formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const DEPOSIT_STATUS_META = {
  PENDING: { label: "Đang chờ duyệt", icon: Clock, className: "text-state-warning" },
  APPROVED: { label: "Đã cộng tiền", icon: CheckCircle2, className: "text-state-success" },
  REJECTED: { label: "Bị từ chối", icon: XCircle, className: "text-state-danger" }
} as const;

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
      <div>
        <p className="text-caption text-white/40">{label}</p>
        <p className="text-small font-medium text-white/90">{value}</p>
      </div>
      <button onClick={handleCopy} className="text-white/40 hover:text-accent-orange" aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4 text-state-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DepositPage() {
  const { data: walletData } = useWallet();
  const { data: settingsData, isLoading: settingsLoading } = usePaymentSettings();
  const { data: depositsData } = useMyDeposits();
  const deposit = useWalletDeposit();
  const uploadProof = useUploadDepositProof();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<"QR_BANK" | "CARD">("QR_BANK");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [cardProvider, setCardProvider] = useState("");
  const [cardSerial, setCardSerial] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const frozen = walletData?.wallet.frozen ?? false;
  const settings = settingsData?.settings;
  const deposits = depositsData?.items ?? [];

  const handleFileChange = (file: File | null) => {
    setProofFile(file);
    setProofPreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setAmount("");
    setProofFile(null);
    setProofPreview(null);
    setCardProvider("");
    setCardSerial("");
    setCardCode("");
    setConfirmed(false);
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      show("Vui lòng nhập số tiền hợp lệ.", "error");
      return;
    }
    if (method === "QR_BANK" && !proofFile) {
      show("Vui lòng tải lên ảnh chụp màn hình chuyển khoản.", "error");
      return;
    }
    if (method === "CARD" && (!cardProvider || cardSerial.trim().length < 3 || cardCode.trim().length < 4)) {
      show("Vui lòng chọn loại thẻ và nhập đầy đủ seri + mã thẻ.", "error");
      return;
    }

    try {
      let proofImageUrl: string | undefined;
      if (method === "QR_BANK" && proofFile) {
        proofImageUrl = await uploadProof.mutateAsync(proofFile);
      }

      await deposit.mutateAsync({
        method,
        amount: value,
        proofImageUrl,
        cardProvider: method === "CARD" ? cardProvider : undefined,
        cardSerial: method === "CARD" ? cardSerial.trim() : undefined,
        cardCode: method === "CARD" ? cardCode.trim() : undefined
      });

      show("Yêu cầu nạp tiền đã được gửi. Vui lòng chờ Admin duyệt.", "success");
      resetForm();
    } catch (err) {
      show(err instanceof ApiError || err instanceof Error ? err.message : "Có lỗi xảy ra.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2 font-display text-white">Nạp tiền</h1>
          <p className="mt-1 text-small text-white/50">Số dư hiện tại: {formatVnd(walletData?.wallet.balance ?? 0)}</p>
        </div>

        {frozen ? (
          <GlassPanel radius="md" className="border-state-danger/30 bg-state-danger/10 p-6 text-small text-white/80">
            Ví của bạn đang bị tạm khóa. Vui lòng liên hệ Admin trước khi nạp tiền.
          </GlassPanel>
        ) : (
          <>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMethod("QR_BANK")}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-md border p-4 text-left transition-colors duration-standard",
                  method === "QR_BANK" ? "border-accent-orange/60 bg-accent-orange/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <QrCode className={cn("h-5 w-5", method === "QR_BANK" ? "text-accent-orange" : "text-white/50")} />
                <div>
                  <p className="text-small font-medium text-white/90">QR Banking</p>
                  <p className="text-caption text-white/40">Chuyển khoản qua mã QR</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMethod("CARD")}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-md border p-4 text-left transition-colors duration-standard",
                  method === "CARD" ? "border-accent-orange/60 bg-accent-orange/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <CreditCard className={cn("h-5 w-5", method === "CARD" ? "text-accent-orange" : "text-white/50")} />
                <div>
                  <p className="text-small font-medium text-white/90">Thẻ cào</p>
                  <p className="text-caption text-white/40">Viettel, Mobifone, Vinaphone...</p>
                </div>
              </button>
            </div>

            <GlassPanel radius="md" className="p-6">
              <Input
                label="Số tiền muốn nạp (VND)"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500000"
              />

              {method === "QR_BANK" ? (
                settingsLoading ? (
                  <LoadingBlock />
                ) : !settings?.accountNumber ? (
                  <p className="mt-4 text-small text-white/50">Admin chưa cấu hình thông tin chuyển khoản.</p>
                ) : (
                  <div className="mt-5 flex flex-col gap-4">
                    {settings.qrImageUrl && (
                      <div className="flex justify-center">
                        <div className="relative h-48 w-48 overflow-hidden rounded-md border border-white/10 bg-white p-2">
                          <Image src={settings.qrImageUrl} alt="QR chuyển khoản" fill className="object-contain" />
                        </div>
                      </div>
                    )}
                    <CopyField label="Ngân hàng" value={settings.bankName ?? ""} />
                    <CopyField label="Chủ tài khoản" value={settings.accountName ?? ""} />
                    <CopyField label="Số tài khoản" value={settings.accountNumber ?? ""} />
                    {settings.transferContent && <CopyField label="Nội dung chuyển khoản" value={settings.transferContent} />}

                    <div>
                      <p className="mb-2 text-small text-white/70">Ảnh chụp màn hình chuyển khoản</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      />
                      {proofPreview ? (
                        <div className="relative h-40 w-full overflow-hidden rounded-md border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview URL, not remote-optimizable */}
                          <img src={proofPreview} alt="Xem trước" className="h-full w-full object-cover" />
                          <button
                            onClick={() => handleFileChange(null)}
                            className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-caption text-white"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-white/20 py-8 text-white/50 hover:border-accent-orange/50 hover:text-accent-orange"
                        >
                          <Upload className="h-5 w-5" />
                          <span className="text-small">Chọn ảnh để tải lên</span>
                        </button>
                      )}
                    </div>

                    <label className="flex items-start gap-2 text-caption text-white/50">
                      <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
                      Tôi xác nhận đã chuyển khoản đúng số tiền và nội dung ở trên.
                    </label>

                    <Button
                      onClick={handleSubmit}
                      isLoading={deposit.isPending || uploadProof.isPending}
                      disabled={!confirmed || !proofFile || !amount}
                    >
                      Tôi đã chuyển
                    </Button>
                  </div>
                )
              ) : (
                <div className="mt-5 flex flex-col gap-4">
                  {settings?.cardInstructions && <p className="text-small text-white/60">{settings.cardInstructions}</p>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-caption font-medium text-white/55">Tên thẻ</span>
                      <select
                        value={cardProvider}
                        onChange={(e) => setCardProvider(e.target.value)}
                        className="h-11 rounded-md border border-white/10 bg-white/[0.04] px-3 text-small text-white outline-none transition focus:border-accent-orange/60"
                      >
                        <option value="" className="bg-[#151515]">Chọn loại thẻ</option>
                        <option value="Viettel" className="bg-[#151515]">Viettel</option>
                        <option value="Mobifone" className="bg-[#151515]">Mobifone</option>
                        <option value="Vinaphone" className="bg-[#151515]">Vinaphone</option>
                        <option value="Vietnamobile" className="bg-[#151515]">Vietnamobile</option>
                        <option value="Garena" className="bg-[#151515]">Garena</option>
                      </select>
                    </label>
                    <Input label="Số seri" value={cardSerial} onChange={(e) => setCardSerial(e.target.value)} placeholder="Nhập số seri trên thẻ" autoComplete="off" />
                  </div>
                  <Input label="Mã thẻ" value={cardCode} onChange={(e) => setCardCode(e.target.value)} placeholder="Nhập mã thẻ cào" autoComplete="off" />
                  {settings?.cardInstructions && <p className="text-caption leading-5 text-white/40">{settings.cardInstructions}</p>}
                  <Button onClick={handleSubmit} isLoading={deposit.isPending} disabled={!cardProvider || !cardSerial || !cardCode || !amount}>
                    Gửi yêu cầu nạp thẻ
                  </Button>
                </div>
              )}
            </GlassPanel>
          </>
        )}
      </div>

      <GlassPanel radius="md" className="h-fit p-6">
        <h2 className="mb-4 text-title text-white">Lịch sử nạp tiền</h2>
        {deposits.length === 0 ? (
          <EmptyState title="Chưa có yêu cầu nào" description="Các yêu cầu nạp tiền của bạn sẽ hiện tại đây." />
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {deposits.map((d) => {
              const meta = DEPOSIT_STATUS_META[d.status];
              const Icon = meta.icon;
              return (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-small text-white/80">{d.method === "QR_BANK" ? "QR Banking" : "Thẻ cào"}</p>
                    <p className="text-caption text-white/35">{formatDateTime(d.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-small font-medium text-white/90">{formatVnd(d.amount)}</p>
                    <p className={cn("flex items-center justify-end gap-1 text-caption", meta.className)}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
