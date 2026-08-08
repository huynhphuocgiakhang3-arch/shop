import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface OrderResult {
  order: { id: string; orderNumber: string; status: string; total: string };
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethod: string) => api.post<OrderResult>("/api/checkout", { paymentMethod }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
