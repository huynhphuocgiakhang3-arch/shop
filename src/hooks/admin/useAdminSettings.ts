import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { uploadDirectToCloudinary } from "@/lib/client/cloudinary-upload";

export interface SiteSettings {
  id: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  loginBackgroundUrl: string | null;
  registerBackgroundUrl: string | null;
  bannerUrl: string | null;
  footerText: string | null;
  announcementEnabled: boolean;
  announcementText: string | null;
  heroPrimaryLine: string;
  heroVariantLine: string;
  heroVaultLine: string;
  heroDescription: string | null;
  heroDescriptionColor: string | null;
  heroHeadlineColor: string | null;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  memberDisplay: string | null;
  fiveStarDisplay: string | null;
  referralEnabled: boolean;
  referralCommissionPercent: number | string;
  updatedAt: string;
}

export type AppearanceTarget = "logo" | "favicon" | "hero" | "loginBackground" | "registerBackground" | "banner";

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: SiteSettings }>("/api/admin/settings")
  });
}

function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    // The public /api/settings powers the maintenance gate + login/register
    // backgrounds — nothing in react-query caches it directly since it's
    // read server-side, so no client cache to invalidate there.
  };
}

export function useUpdateSettings() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (patch: Partial<Omit<SiteSettings, "id" | "updatedAt">>) => api.patch<{ settings: SiteSettings }>("/api/admin/settings", patch),
    onSuccess: invalidate
  });
}

export function useUploadAppearanceImage() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: async ({ target, file }: { target: AppearanceTarget; file: File }) => {
      const result = await uploadDirectToCloudinary(file, "appearance", { slot: target });
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST", body: JSON.stringify({ target, url: result.url, publicId: result.publicId }),
        headers: { "Content-Type": "application/json" }, credentials: "include"
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "Lưu ảnh lên thất bại.");
      return body as { settings: SiteSettings };
    },
    onSuccess: invalidate
  });
}

export function useRemoveAppearanceImage() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (target: AppearanceTarget) => api.delete<{ settings: SiteSettings }>("/api/admin/settings/upload", { target }),
    onSuccess: invalidate
  });
}
