"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Upload, X, Power, Loader2, Gift, Percent } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LoadingBlock, EmptyState } from "@/components/dashboard/primitives";
import {
  useAdminSettings,
  useUpdateSettings,
  useUploadAppearanceImage,
  useRemoveAppearanceImage,
  type AppearanceTarget,
  type SiteSettings
} from "@/hooks/admin/useAdminSettings";

const SLOTS: { target: AppearanceTarget; field: keyof ReturnType<typeof slotFields>; label: string; hint: string }[] = [
  { target: "logo", field: "logoUrl", label: "Logo", hint: "Hiển thị ở header và trang quản trị." },
  { target: "favicon", field: "faviconUrl", label: "Favicon", hint: "Biểu tượng trên tab trình duyệt." },
  { target: "hero", field: "heroImageUrl", label: "Ảnh Hero trang chủ", hint: "Banner lớn ở đầu trang chủ." },
  { target: "loginBackground", field: "loginBackgroundUrl", label: "Background trang Đăng nhập", hint: "Ảnh nền phía sau khung kính đăng nhập." },
  { target: "registerBackground", field: "registerBackgroundUrl", label: "Background trang Đăng ký", hint: "Ảnh nền phía sau khung kính đăng ký." },
  { target: "banner", field: "bannerUrl", label: "Banner khuyến mãi", hint: "Banner hiển thị trong trang chủ/danh mục." }
];

// Helper only exists to give the SLOTS array above a typed `field` without
// repeating the SiteSettings type import gymnastics.
function slotFields() {
  return {
    logoUrl: "",
    faviconUrl: "",
    heroImageUrl: "",
    loginBackgroundUrl: "",
    registerBackgroundUrl: "",
    bannerUrl: ""
  };
}

export function AppearanceSettingsClient() {
  const { data, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const uploadImage = useUploadAppearanceImage();
  const removeImage = useRemoveAppearanceImage();
  const toast = useToast();

  const [message, setMessage] = useState<string | null>(null);

  if (isLoading) return <LoadingBlock />;
  const settings = data?.settings;
  if (!settings) return <EmptyState title="Không thể tải cài đặt giao diện" description="Đã có lỗi khi tải cài đặt hệ thống. Vui lòng tải lại trang." />;

  const currentMessage = message ?? settings.maintenanceMessage ?? "";

  const handleToggleMaintenance = async () => {
    try {
      await updateSettings.mutateAsync({ maintenanceMode: !settings.maintenanceMode });
      toast.show(
        !settings.maintenanceMode ? "Đã bật chế độ bảo trì. Website chỉ Super Admin truy cập được." : "Đã tắt chế độ bảo trì.",
        "success"
      );
    } catch {
      toast.show("Không thể cập nhật chế độ bảo trì.", "error");
    }
  };

  const handleSaveMessage = async () => {
    try {
      await updateSettings.mutateAsync({ maintenanceMessage: currentMessage || null });
      toast.show("Đã lưu thông báo bảo trì.", "success");
    } catch {
      toast.show("Không thể lưu thông báo.", "error");
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-h2 font-display text-white">Giao diện & Hệ thống</h1>
        <p className="mt-1 text-small text-white/50">
          Chỉ Super Admin. Thay đổi có hiệu lực ngay lập tức trên toàn bộ website — không cần sửa code, deploy hay restart.
        </p>
      </div>

      {/* Maintenance Mode */}
      <GlassPanel className="min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                settings.maintenanceMode ? "bg-state-danger/15 text-state-danger" : "bg-state-success/15 text-state-success"
              }`}
            >
              <Power className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-body font-medium text-white">Chế độ bảo trì (Maintenance Mode)</h2>
              <p className="mt-1 text-small text-white/50">
                Khi bật, toàn bộ website hiển thị màn hình bảo trì cho mọi người — ngoại trừ Super Admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.maintenanceMode}
            onClick={handleToggleMaintenance}
            disabled={updateSettings.isPending}
            className={`relative h-8 w-14 shrink-0 rounded-pill transition-colors duration-standard disabled:opacity-50 ${
              settings.maintenanceMode ? "bg-state-danger" : "bg-white/15"
            }`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
              style={{ left: settings.maintenanceMode ? "calc(100% - 28px)" : "4px" }}
            />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <label className="text-caption uppercase tracking-wide text-white/40">Thông báo bảo trì (tuỳ chọn)</label>
          <textarea
            value={currentMessage}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Chúng tôi sẽ quay lại sớm."
            rows={2}
            className="glass-surface w-full resize-none rounded-md border border-white/10 bg-transparent px-4 py-3 text-small text-white/85 outline-none focus:border-accent-orange/50"
          />
          <div>
            <Button variant="secondary" onClick={handleSaveMessage} isLoading={updateSettings.isPending} className="min-h-[40px] px-4 py-2 text-caption">
              Lưu thông báo
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Homepage content / CMS */}
      <GlassPanel className="min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-body font-medium text-white">Homepage CMS & Social Proof</h2>
            <p className="mt-1 text-small text-white/50">Chỉnh headline, CTA, announcement và số hiển thị xã hội mà không cần sửa source.</p>
          </div>
          <label className="flex items-center gap-2 text-caption text-white/55">
            <input type="checkbox" checked={settings.announcementEnabled} onChange={(e) => updateSettings.mutate({ announcementEnabled: e.target.checked })} />
            Announcement
          </label>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <CmsField label="Dòng chính" value={settings.heroPrimaryLine} onSave={(value) => updateSettings.mutate({ heroPrimaryLine: value })} />
          <CmsField label="Dòng chuyển động" value={settings.heroVariantLine} onSave={(value) => updateSettings.mutate({ heroVariantLine: value })} />
          <CmsField label="Dòng Vault" value={settings.heroVaultLine} onSave={(value) => updateSettings.mutate({ heroVaultLine: value })} />
          <CmsField label="Announcement" value={settings.announcementText ?? ""} onSave={(value) => updateSettings.mutate({ announcementText: value || null })} />
          <CmsField label="CTA chính" value={settings.heroPrimaryCta} onSave={(value) => updateSettings.mutate({ heroPrimaryCta: value })} />
          <CmsField label="CTA phụ" value={settings.heroSecondaryCta} onSave={(value) => updateSettings.mutate({ heroSecondaryCta: value })} />
          <CmsField label="Thành viên hiển thị (vd 1k9+)" value={settings.memberDisplay ?? ""} onSave={(value) => updateSettings.mutate({ memberDisplay: value || null })} />
          <CmsField label="Đánh giá 5 sao hiển thị (vd 1k+)" value={settings.fiveStarDisplay ?? ""} onSave={(value) => updateSettings.mutate({ fiveStarDisplay: value || null })} />
        </div>
        <CmsTextArea label="Mô tả Hero" value={settings.heroDescription ?? ""} onSave={(value) => updateSettings.mutate({ heroDescription: value || null })} />
      </GlassPanel>

      {/* Referral / Affiliate program */}
      <ReferralSettingsPanel settings={settings} updateSettings={updateSettings} />

      {/* Appearance */}
      <GlassPanel className="min-w-0 overflow-hidden p-4 sm:p-6">
        <h2 className="text-body font-medium text-white">Appearance</h2>
        <p className="mt-1 text-small text-white/50">Tải ảnh lên Cloudinary — website tự cập nhật ngay sau khi tải xong.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SLOTS.map((slot) => (
            <AppearanceSlot
              key={slot.target}
              target={slot.target}
              label={slot.label}
              hint={slot.hint}
              currentUrl={(settings as unknown as Record<string, string | null>)[slot.field]}
              onUpload={(file) => uploadImage.mutate({ target: slot.target, file })}
              onRemove={() => removeImage.mutate(slot.target)}
              isUploading={uploadImage.isPending && uploadImage.variables?.target === slot.target}
              isRemoving={removeImage.isPending && removeImage.variables === slot.target}
            />
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

function ReferralSettingsPanel({
  settings,
  updateSettings
}: {
  settings: SiteSettings;
  updateSettings: ReturnType<typeof useUpdateSettings>;
}) {
  const toast = useToast();
  const [percentDraft, setPercentDraft] = useState(String(settings.referralCommissionPercent));
  const [dirty, setDirty] = useState(false);

  const handleToggle = () => {
    updateSettings.mutate(
      { referralEnabled: !settings.referralEnabled },
      {
        onSuccess: () =>
          toast.show(!settings.referralEnabled ? "Đã bật chương trình giới thiệu." : "Đã tắt chương trình giới thiệu.", "success"),
        onError: () => toast.show("Không thể cập nhật chương trình giới thiệu.", "error")
      }
    );
  };

  const handleSavePercent = () => {
    const value = Number(percentDraft);
    if (!Number.isFinite(value) || value < 0 || value > 50) {
      toast.show("Tỷ lệ hoa hồng phải từ 0 đến 50%.", "error");
      return;
    }
    updateSettings.mutate(
      { referralCommissionPercent: value },
      {
        onSuccess: () => {
          toast.show("Đã lưu tỷ lệ hoa hồng.", "success");
          setDirty(false);
        },
        onError: () => toast.show("Không thể lưu tỷ lệ hoa hồng.", "error")
      }
    );
  };

  return (
    <GlassPanel className="min-w-0 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              settings.referralEnabled ? "bg-state-success/15 text-state-success" : "bg-white/10 text-white/40"
            }`}
          >
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-body font-medium text-white">Chương trình giới thiệu (Referral / Affiliate)</h2>
            <p className="mt-1 text-small text-white/50">
              Người giới thiệu nhận % giá trị đơn hàng <strong className="text-white/70">đầu tiên</strong> của mỗi người bạn mời — cộng thẳng vào Wallet ngay khi đơn được thanh toán. Xem bảng xếp hạng tại{" "}
              <span className="text-white/70">Admin → Giới thiệu bạn bè</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={settings.referralEnabled}
          onClick={handleToggle}
          disabled={updateSettings.isPending}
          className={`relative h-8 w-14 shrink-0 rounded-pill transition-colors duration-standard disabled:opacity-50 ${
            settings.referralEnabled ? "bg-state-success" : "bg-white/15"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
            style={{ left: settings.referralEnabled ? "calc(100% - 28px)" : "4px" }}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <label className="text-caption uppercase tracking-wide text-white/40">Tỷ lệ hoa hồng (% giá trị đơn hàng)</label>
        <div className="flex min-w-0 max-w-xs gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              type="number"
              min={0}
              max={50}
              step="0.5"
              value={percentDraft}
              onChange={(e) => {
                setPercentDraft(e.target.value);
                setDirty(true);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 pr-9 text-small text-white outline-none focus:border-accent-orange/50"
            />
            <Percent className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          </div>
          <Button variant="secondary" className="shrink-0 px-3 text-caption" disabled={!dirty} onClick={handleSavePercent} isLoading={updateSettings.isPending}>
            Lưu
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}

function CmsField({ label, value, onSave }: { label: string; value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-caption uppercase tracking-wide text-white/40">{label}</label>
      <div className="flex min-w-0 gap-2">
        <input value={draft} onChange={(e) => { setDraft(e.target.value); setDirty(true); }} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-small text-white outline-none focus:border-accent-orange/50" />
        <Button variant="secondary" className="shrink-0 px-3 text-caption" disabled={!dirty} onClick={() => { onSave(draft); setDirty(false); }}>Lưu</Button>
      </div>
    </div>
  );
}

function CmsTextArea({ label, value, onSave }: { label: string; value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);
  return (
    <div className="mt-4">
      <label className="mb-2 block text-caption uppercase tracking-wide text-white/40">{label}</label>
      <textarea value={draft} onChange={(e) => { setDraft(e.target.value); setDirty(true); }} rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-small text-white outline-none focus:border-accent-orange/50" />
      <Button variant="secondary" className="mt-2 px-3 text-caption" disabled={!dirty} onClick={() => { onSave(draft); setDirty(false); }}>Lưu mô tả</Button>
    </div>
  );
}

function AppearanceSlot({
  target,
  label,
  hint,
  currentUrl,
  onUpload,
  onRemove,
  isUploading,
  isRemoving
}: {
  target: AppearanceTarget;
  label: string;
  hint: string;
  currentUrl: string | null | undefined;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
  isRemoving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.show("Ảnh tối đa 8MB.", "error");
      return;
    }
    onUpload(file);
  };

  return (
    <div className="glass-surface flex flex-col overflow-hidden rounded-md border border-white/10">
      <div className="relative flex h-32 items-center justify-center bg-black/30">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URLs, not a static/known-domain asset
          <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-white/20" />
        )}
        {(isUploading || isRemoving) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-accent-orange" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-small font-medium text-white/85">{label}</p>
          <p className="text-caption text-white/40">{hint}</p>
        </div>
        <div className="mt-auto flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            variant="secondary"
            className="min-h-[36px] flex-1 px-3 py-1.5 text-caption"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-3.5 w-3.5" /> Tải lên
          </Button>
          {currentUrl && (
            <Button variant="ghost" className="min-h-[36px] px-2.5 py-1.5 text-caption" onClick={onRemove} disabled={isRemoving} aria-label={`Xóa ${label}`}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
