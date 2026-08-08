"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Save } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { LoadingBlock } from "@/components/dashboard/primitives";
import { useAdminPaymentSettings, useUpdatePaymentSettings, useUploadPaymentAsset } from "@/hooks/admin/useAdminPaymentSettings";

const TEXT_FIELDS: { key: "bankName" | "accountName" | "accountNumber" | "transferContent" | "cardInstructions"; label: string; placeholder: string }[] = [
  { key: "bankName", label: "Tên ngân hàng", placeholder: "Vietcombank" },
  { key: "accountName", label: "Tên chủ tài khoản", placeholder: "NGUYEN VAN A" },
  { key: "accountNumber", label: "Số tài khoản", placeholder: "0123456789" },
  { key: "transferContent", label: "Nội dung chuyển khoản mẫu", placeholder: "NAPTIEN {uid}" },
  { key: "cardInstructions", label: "Hướng dẫn nạp thẻ cào", placeholder: "Nhập seri và mã thẻ, chọn đúng mệnh giá..." }
];

export default function AdminPaymentSettingsPage() {
  const { data, isLoading } = useAdminPaymentSettings();
  const update = useUpdatePaymentSettings();
  const uploadAsset = useUploadPaymentAsset();
  const { show } = useToast();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        bankName: s.bankName ?? "",
        accountName: s.accountName ?? "",
        accountNumber: s.accountNumber ?? "",
        transferContent: s.transferContent ?? "",
        cardInstructions: s.cardInstructions ?? ""
      });
    }
  }, [data?.settings]);

  if (isLoading) return <LoadingBlock />;
  const settings = data?.settings;
  if (!settings) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      show("Đã lưu thông tin thanh toán. Website cập nhật ngay.", "success");
    } catch {
      show("Lưu thất bại. Vui lòng thử lại.", "error");
    }
  };

  const handleUpload = async (target: "qr" | "bankLogo", file: File | null) => {
    if (!file) return;
    try {
      await uploadAsset.mutateAsync({ file, target });
      show("Đã cập nhật ảnh.", "success");
    } catch (err) {
      show(err instanceof Error ? err.message : "Tải ảnh lên thất bại.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-display text-white">Cấu hình thanh toán — QR Banking</h1>
        <p className="mt-1 text-small text-white/50">Thay đổi tại đây cập nhật ngay trên trang Nạp tiền, không cần deploy lại.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <GlassPanel radius="md" className="flex flex-col gap-4 p-6">
          {TEXT_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              value={form[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ))}
          <Button onClick={handleSave} isLoading={update.isPending} className="mt-2 self-start">
            <Save className="h-4 w-4" /> Lưu
          </Button>
        </GlassPanel>

        <div className="flex flex-col gap-6">
          <GlassPanel radius="md" className="p-6">
            <p className="mb-3 text-small text-white/70">Ảnh QR chuyển khoản</p>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload("qr", e.target.files?.[0] ?? null)}
            />
            {settings.qrImageUrl ? (
              <div className="relative mb-3 h-48 w-full overflow-hidden rounded-md border border-white/10 bg-white p-2">
                <Image src={settings.qrImageUrl} alt="QR" fill className="object-contain" />
              </div>
            ) : (
              <div className="mb-3 flex h-48 items-center justify-center rounded-md border border-dashed border-white/20 text-caption text-white/35">
                Chưa có ảnh QR
              </div>
            )}
            <Button variant="secondary" onClick={() => qrInputRef.current?.click()} isLoading={uploadAsset.isPending}>
              <Upload className="h-4 w-4" /> Tải ảnh QR
            </Button>
          </GlassPanel>

          <GlassPanel radius="md" className="p-6">
            <p className="mb-3 text-small text-white/70">Logo ngân hàng</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload("bankLogo", e.target.files?.[0] ?? null)}
            />
            {settings.bankLogoUrl ? (
              <div className="relative mb-3 h-20 w-full overflow-hidden rounded-md border border-white/10 bg-white p-2">
                <Image src={settings.bankLogoUrl} alt="Logo" fill className="object-contain" />
              </div>
            ) : (
              <div className="mb-3 flex h-20 items-center justify-center rounded-md border border-dashed border-white/20 text-caption text-white/35">
                Chưa có logo
              </div>
            )}
            <Button variant="secondary" onClick={() => logoInputRef.current?.click()} isLoading={uploadAsset.isPending}>
              <Upload className="h-4 w-4" /> Tải logo
            </Button>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
