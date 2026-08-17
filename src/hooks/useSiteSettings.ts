import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface PublicSiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  loginBackgroundUrl: string | null;
  registerBackgroundUrl: string | null;
  bannerUrl: string | null;
  footerText: string | null;
}

export function usePublicSiteSettings() {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.get<{ settings: PublicSiteSettings }>("/api/settings", { silent: true }),
    staleTime: 60_000
  });
}
