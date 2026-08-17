import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  usageLimit: number | null;
  usageCount: number;
  minTier: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  usageLimit?: number;
  minTier: "FREE" | "SILVER" | "GOLD" | "DIAMOND";
  expiresAt?: string;
}

export function useAdminCoupons() {
  return useQuery({ queryKey: ["admin", "coupons"], queryFn: () => api.get<{ coupons: AdminCoupon[] }>("/api/admin/coupons") });
}

function useInvalidateAdminCoupons() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
}

export function useCreateCoupon() {
  const refresh = useInvalidateAdminCoupons();
  return useMutation({ mutationFn: (input: CouponInput) => api.post<{ coupon: AdminCoupon }>("/api/admin/coupons", input), onSuccess: refresh });
}

export function useToggleCoupon() {
  const refresh = useInvalidateAdminCoupons();
  return useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch<{ coupon: AdminCoupon }>(`/api/admin/coupons/${id}`, { isActive }), onSuccess: refresh });
}

export function useDeleteCoupon() {
  const refresh = useInvalidateAdminCoupons();
  return useMutation({ mutationFn: (id: string) => api.delete(`/api/admin/coupons/${id}`), onSuccess: refresh });
}
