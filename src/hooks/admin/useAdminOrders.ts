import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  total: string;
  paymentMethod: string;
  createdAt: string;
  user: { displayName: string; email: string };
  items: { id: string; quantity: number; unitPrice: string }[];
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ["admin", "orders", status ?? "all"],
    queryFn: () => api.get<Paginated<AdminOrderListItem>>(`/api/admin/orders${status ? `?status=${status}` : ""}`)
  });
}

function useInvalidateOrders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "orders"] });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PAID" | "CANCELLED" }) =>
      api.patch(`/api/admin/orders/${id}`, { status }),
    onSuccess: invalidate
  });
}

export function useRefundOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/orders/${id}/refund`),
    onSuccess: invalidate
  });
}
