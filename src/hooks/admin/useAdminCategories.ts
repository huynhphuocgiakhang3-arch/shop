import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { uploadDirectToCloudinary } from "@/lib/client/cloudinary-upload";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  bannerUrl: string | null;
  order: number;
  parentId: string | null;
  _count: { products: number };
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get<{ categories: AdminCategory[] }>("/api/admin/categories")
  });
}

function invalidate() {
  // Hook helper kept outside React so each mutation can share the same cache key.
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; icon?: string; color?: string; bannerUrl?: string; order?: number; parentId?: string | null }) =>
      api.post("/api/admin/categories", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ name: string; slug: string; icon: string; color: string; bannerUrl: string; order: number; parentId: string | null }> }) =>
      api.patch(`/api/admin/categories/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  });
}

export function useUploadCategoryBanner() {
  return useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadDirectToCloudinary(file, "category-banner");
      const res = await fetch("/api/admin/categories/upload-banner", {
        method: "POST", body: JSON.stringify({ url: result.url, publicId: result.publicId }),
        headers: { "Content-Type": "application/json" }, credentials: "include"
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.url) throw new Error(body?.message ?? "Lưu banner thất bại.");
      return body as { url: string; publicId?: string };
    }
  });
}
