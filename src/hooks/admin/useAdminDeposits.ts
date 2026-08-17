import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminDepositItem {
  id: string;
  method: "QR_BANK" | "CARD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: string;
  proofImageUrl: string | null;
  cardProvider: string | null;
  cardSerial: string | null;
  cardCode: string | null;
  rejectReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; displayName: string; email: string; avatarUrl: string | null };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAdminDeposits(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return useQuery({
    queryKey: ["admin", "deposits", status ?? "ALL"],
    queryFn: () => api.get<Paginated<AdminDepositItem>>(`/api/admin/deposits?${status ? `status=${status}&` : ""}pageSize=50`),
    refetchInterval: 10_000
  });
}

function useInvalidateDeposits() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "deposits"] });
}

export function useApproveDeposit() {
  const invalidate = useInvalidateDeposits();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/deposits/${id}/approve`, {}),
    onSuccess: invalidate
  });
}

export function useRejectDeposit() {
  const invalidate = useInvalidateDeposits();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.post(`/api/admin/deposits/${id}/reject`, { reason }),
    onSuccess: invalidate
  });
}
