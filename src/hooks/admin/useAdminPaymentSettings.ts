import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { uploadDirectToCloudinary } from "@/lib/client/cloudinary-upload";

export interface AdminPaymentSettings {
  id: string;
  bankName: string | null;
  bankLogoUrl: string | null;
  accountName: string | null;
  accountNumber: string | null;
  transferContent: string | null;
  qrImageUrl: string | null;
  cardInstructions: string | null;
  updatedAt: string;
}

export function useAdminPaymentSettings() {
  return useQuery({
    queryKey: ["admin", "payment-settings"],
    queryFn: () => api.get<{ settings: AdminPaymentSettings }>("/api/admin/payment-settings")
  });
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<AdminPaymentSettings, "id" | "updatedAt">>) => api.patch("/api/admin/payment-settings", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment-settings"] })
  });
}

export function useUploadPaymentAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, target }: { file: File; target: "qr" | "bankLogo" }) => {
      const result = await uploadDirectToCloudinary(file, "payment-asset", { slot: target });
      const res = await fetch("/api/admin/payment-settings/upload", {
        method: "POST", body: JSON.stringify({ file: { name: file.name }, target, url: result.url, publicId: result.publicId }),
        headers: { "Content-Type": "application/json" }, credentials: "include"
      });
      const body = (await res.json().catch(() => ({}))) as { settings?: AdminPaymentSettings; message?: string };
      if (!res.ok || !body.settings) throw new Error(body.message ?? "Lưu ảnh lên thất bại.");
      return body.settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment-settings"] })
  });
}
