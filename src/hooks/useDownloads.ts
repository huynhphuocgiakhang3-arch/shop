import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface DownloadItem {
  id: string;
  token: string;
  downloadCount: number;
  createdAt: string;
  product: { name: string; thumbnailUrl: string; slug: string; version: string };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useDownloadHistory() {
  return useQuery({ queryKey: ["downloads"], queryFn: () => api.get<Paginated<DownloadItem>>("/api/downloads") });
}

export function useGenerateDownload() {
  return useMutation({
    mutationFn: (orderItemId: string) => api.post<{ downloadUrl: string }>("/api/downloads", { orderItemId })
  });
}
