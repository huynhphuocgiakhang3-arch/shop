import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface DownloadItem {
  id: string;
  token: string;
  downloadCount: number;
  createdAt: string;
  product: { name: string; thumbnailUrl: string; slug: string; version: string; fileSizeMb: number | null };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// pageSize 48 (the API's max is 50) — a personal library is realistically
// bounded, so one page covers virtually every user without building out
// full pagination UI for what is, in practice, a single screen of cards.
export function useDownloadHistory() {
  return useQuery({ queryKey: ["downloads"], queryFn: () => api.get<Paginated<DownloadItem>>("/api/downloads?pageSize=48") });
}

export function useGenerateDownload() {
  return useMutation({
    mutationFn: (orderItemId: string) => api.post<{ downloadUrl: string }>("/api/downloads", { orderItemId })
  });
}
