import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  membershipTier: "FREE" | "SILVER" | "GOLD" | "DIAMOND";
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: { orders: number };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryKey: ["admin", "users", q ?? ""],
    queryFn: () => api.get<Paginated<AdminUserListItem>>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  });
}

function useInvalidateUsers() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "users"] });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { role?: string; membershipTier?: string; isBanned?: boolean } }) =>
      api.patch(`/api/admin/users/${id}`, input),
    onSuccess: invalidate
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: invalidate
  });
}

export function useAdjustWallet() {
  return useMutation({
    mutationFn: (input: { userId: string; amount: number; note?: string }) => api.post("/api/admin/wallet/adjust", input)
  });
}

export function useFreezeWallet() {
  return useMutation({
    mutationFn: (input: { userId: string; frozen: boolean; reason?: string }) => api.post("/api/admin/wallet/freeze", input)
  });
}

export function useResetWallet() {
  return useMutation({
    mutationFn: (input: { userId: string; reason?: string }) => api.post("/api/admin/wallet/reset", input)
  });
}
