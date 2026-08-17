import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface MusicTrackPublic {
  id: string;
  title: string;
  artist: string | null;
  source: "MP3" | "YOUTUBE" | "CLOUDINARY";
  url: string;
  coverUrl: string | null;
}

export function useMusicPlaylist() {
  return useQuery({
    queryKey: ["music", "playlist"],
    queryFn: () => api.get<{ tracks: MusicTrackPublic[] }>("/api/music"),
    staleTime: 5 * 60_000
  });
}
