import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminOverview {
  revenue: { total: number | string; today: number | string; thisMonth: number | string };
  orders: Record<string, number>;
  users: { total: number; newLast30Days: number };
  topProducts: { id: string; name: string; slug: string; salesCount: number; downloadCount: number; thumbnailUrl: string }[];
  pendingTickets: number;
  pendingWalletTransactions: number;
  dailySeries: { date: string; revenue: number; orders: number }[];
}

// Live-ish dashboard: refetch every 30s while the tab is open so the
// revenue chart and pending-approval counters stay current without a
// manual refresh, without hammering the DB (30s is cheap for aggregates
// this small; bump if traffic grows).
export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get<AdminOverview>("/api/admin/overview"),
    refetchInterval: 30_000
  });
}
