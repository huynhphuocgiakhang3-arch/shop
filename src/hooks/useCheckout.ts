import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface OrderResult {
  order: { id: string; orderNumber: string; status: string; total: string };
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (_unused?: void) => api.post<OrderResult>("/api/checkout", { paymentMethod: "WALLET" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
