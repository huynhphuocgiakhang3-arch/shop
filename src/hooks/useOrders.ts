import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  total: string;
  paymentMethod: string;
  createdAt: string;
  items: { id: string; quantity: number; unitPrice?: string; licenseKey?: string | null; product: { name: string; thumbnailUrl: string; slug: string; licenseType?: string | null } }[];
  paymentNote?: string | null;
  paidAt?: string | null;
  adminNote?: string | null;
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ["orders", status ?? "all"],
    queryFn: () => api.get<Paginated<OrderListItem>>(`/api/orders${status ? `?status=${status}` : ""}`)
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<{ order: OrderListItem & { subtotal: string; discountTotal: string; taxTotal: string; coupon: { code: string } | null } }>(`/api/orders/${id}`),
    enabled: Boolean(id)
  });
}
