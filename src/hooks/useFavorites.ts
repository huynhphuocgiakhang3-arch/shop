import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface FavoriteItem {
  id: string;
  createdAt: string;
  product: { id: string; name: string; slug: string; thumbnailUrl: string; price: string; discountPrice: string | null };
}

export function useFavorites() {
  return useQuery({ queryKey: ["favorites"], queryFn: () => api.get<{ favorites: FavoriteItem[] }>("/api/favorites") });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.post<{ isFavorited: boolean }>(`/api/favorites/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] })
  });
}
