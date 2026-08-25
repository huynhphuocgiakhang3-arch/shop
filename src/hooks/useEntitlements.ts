import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

export function useEntitlements() {
  const { data } = useCurrentUser();
  return useQuery({
    queryKey: ["entitlements"],
    enabled: Boolean(data?.user),
    staleTime: 60_000,
    queryFn: () => api.get<{ productIds: string[] }>("/api/me/entitlements")
  });
}

export function useOwnedSet() {
  const { data } = useEntitlements();
  return new Set(data?.productIds ?? []);
}
