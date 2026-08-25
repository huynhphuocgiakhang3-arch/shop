import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useProfile";

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  savedForLater: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string;
    price: string;
    discountPrice: string | null;
    stock: number | null;
  };
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

export interface CartResponse {
  cart: { id: string; items: CartItem[]; couponId: string | null; coupon: { code: string } | null };
  summary: CartSummary;
}

const CART_KEY = ["cart"];

export function useCart() {
  const { data } = useCurrentUser();
  return useQuery({
    queryKey: CART_KEY,
    enabled: Boolean(data?.user),
    queryFn: () => api.get<CartResponse>("/api/cart"),
    retry: false
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; quantity?: number }) => api.post<CartResponse>("/api/cart/items", input),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data)
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch<CartResponse>(`/api/cart/items/${id}`, { quantity }),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data)
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<CartResponse>(`/api/cart/items/${id}`),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data)
  });
}

export function useToggleSaveForLater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put<{ item: CartItem }>(`/api/cart/items/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY })
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<CartResponse>("/api/cart/coupon", { code }),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data)
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<CartResponse>("/api/cart/coupon"),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data)
  });
}
