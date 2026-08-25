import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface VaultMeta {
  productId: string;
  pinned: boolean;
  pinnedAt: string | null;
  notes: string | null;
  tags: string[];
}

export function useVaultItems() {
  return useQuery({
    queryKey: ["vault-items"],
    queryFn: () => api.get<{ items: VaultMeta[] }>("/api/vault/items")
  });
}

export function useUpdateVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; pinned?: boolean; notes?: string | null; tags?: string[] }) =>
      api.patch<{ item: VaultMeta }>("/api/vault/items", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault-items"] });
      qc.invalidateQueries({ queryKey: ["downloads"] });
    }
  });
}
