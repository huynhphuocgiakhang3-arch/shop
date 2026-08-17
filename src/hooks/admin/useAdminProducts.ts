import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  galleryUrls?: string[];
  featureBullets?: string[];
  price: string;
  discountPrice: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  isVipOnly: boolean;
  categoryId: string;
  category: { name: string };
  createdAt: string;
  salesCount: number;
  fileUrl?: string | null;
  releaseNotes?: string | null;
  version?: string;
  fileSizeMb?: number | null;
  compatibility?: string | null;
}

export interface ProductFormInput {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  galleryUrls?: string[];
  featureBullets?: string[];
  price: number;
  discountPrice?: number;
  categoryId: string;
  isFeatured: boolean;
  isVipOnly: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  salesCount?: number;
  fileUrl?: string;
  releaseNotes?: string;
  version?: string;
  fileSizeMb?: number;
  compatibility?: string;
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAdminProducts(status?: string) {
  return useQuery({
    queryKey: ["admin", "products", status ?? "all"],
    queryFn: () => api.get<Paginated<AdminProduct>>(`/api/admin/products${status ? `?status=${status}` : ""}`)
  });
}

function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "products"] });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductFormInput) => api.post<{ product: AdminProduct }>("/api/admin/products", input),
    onSuccess: invalidate
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductFormInput> }) =>
      api.patch<{ product: AdminProduct }>(`/api/admin/products/${id}`, input),
    onSuccess: invalidate
  });
}

export function useArchiveProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ product: AdminProduct }>(`/api/admin/products/${id}`),
    onSuccess: invalidate
  });
}

export function useDuplicateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.post<{ product: AdminProduct }>(`/api/admin/products/${id}/duplicate`),
    onSuccess: invalidate
  });
}

export function useRestoreProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => api.post<{ product: AdminProduct }>(`/api/admin/products/${id}/restore`),
    onSuccess: invalidate
  });
}
