import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminOverview {
  revenue: { total: number | string; today: number | string; thisMonth: number | string };
  orders: Record<string, number>;
  users: { total: number; newLast30Days: number };
  topProducts: { id: string; name: string; slug: string; salesCount: number; downloadCount: number; thumbnailUrl: string }[];
  pendingTickets: number;
  pendingWalletTransactions: number;
}

export function useAdminOverview() {
  return useQuery({ queryKey: ["admin", "overview"], queryFn: () => api.get<AdminOverview>("/api/admin/overview") });
}
