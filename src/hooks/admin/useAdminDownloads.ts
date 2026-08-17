import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminDownloadToken {
  id: string;
  token: string;
  downloadCount: number;
  expiresAt: string | null;
  createdAt: string;
  user: { displayName: string; email: string };
  product: { name: string; slug: string };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAdminDownloads(page = 1) {
  return useQuery({
    queryKey: ["admin", "downloads", page],
    queryFn: () => api.get<Paginated<AdminDownloadToken>>(`/api/admin/downloads?page=${page}`)
  });
}

export function useRevokeDownload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/downloads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "downloads"] })
  });
}
