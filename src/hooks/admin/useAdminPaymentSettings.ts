import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

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
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);
      const res = await fetch("/api/admin/payment-settings/upload", { method: "POST", body: form, credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as { settings?: AdminPaymentSettings; message?: string };
      if (!res.ok || !body.settings) throw new Error(body.message ?? "Tải ảnh lên thất bại.");
      return body.settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment-settings"] })
  });
}
