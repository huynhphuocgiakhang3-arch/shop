import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminMusicTrack {
  id: string;
  title: string;
  artist: string | null;
  source: "MP3" | "YOUTUBE" | "CLOUDINARY";
  url: string;
  coverUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export function useAdminMusic() {
  return useQuery({
    queryKey: ["admin", "music"],
    queryFn: () => api.get<{ tracks: AdminMusicTrack[] }>("/api/admin/music")
  });
}

function useInvalidateMusic() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "music"] });
}

export function useCreateMusicTrack() {
  const invalidate = useInvalidateMusic();
  return useMutation({
    mutationFn: (input: { title: string; artist?: string; source: AdminMusicTrack["source"]; url: string; coverUrl?: string }) =>
      api.post("/api/admin/music", input),
    onSuccess: invalidate
  });
}

export function useUpdateMusicTrack() {
  const invalidate = useInvalidateMusic();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<AdminMusicTrack, "title" | "artist" | "url" | "coverUrl" | "isActive">> }) =>
      api.patch(`/api/admin/music/${id}`, input),
    onSuccess: invalidate
  });
}

export function useDeleteMusicTrack() {
  const invalidate = useInvalidateMusic();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/music/${id}`),
    onSuccess: invalidate
  });
}

export function useReorderMusic() {
  const invalidate = useInvalidateMusic();
  return useMutation({
    mutationFn: (ids: string[]) => api.post("/api/admin/music/reorder", { ids }),
    onSuccess: invalidate
  });
}
