import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface OrderResult {
  order: { id: string; orderNumber: string; status: string; total: string; paymentMethod?: string };
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { paymentMethod: "WALLET" | "BANK_TRANSFER"; paymentNote?: string }) =>
      api.post<OrderResult>("/api/checkout", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
