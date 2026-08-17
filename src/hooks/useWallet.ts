import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { uploadDirectToCloudinary } from "@/lib/client/cloudinary-upload";

export interface Wallet {
  id: string;
  balance: string;
  pendingBalance: string;
  bonusBalance: string;
  frozen: boolean;
  frozenReason: string | null;
}

export interface WalletTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "PURCHASE" | "REFUND" | "BONUS" | "COMMISSION" | "ADJUSTMENT";
  status: "PENDING" | "COMPLETED" | "REJECTED";
  amount: string;
  note: string | null;
  createdAt: string;
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useWallet() {
  return useQuery({ queryKey: ["wallet"], queryFn: () => api.get<{ wallet: Wallet }>("/api/wallet") });
}

export function useWalletTransactions() {
  return useInfiniteQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: ({ pageParam }) => api.get<Paginated<WalletTransaction>>(`/api/wallet/transactions?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined)
  });
}

export function useWalletDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { method: "QR_BANK" | "CARD"; amount: number; proofImageUrl?: string; cardProvider?: string; cardSerial?: string; cardCode?: string; note?: string }) =>
      api.post<{ deposit: DepositRequest }>("/api/wallet/deposit", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet", "deposits"] })
  });
}

export interface DepositRequest {
  id: string;
  method: "QR_BANK" | "CARD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: string;
  proofImageUrl: string | null;
  cardProvider: string | null;
  cardSerial: string | null;
  cardCode: string | null;
  rejectReason: string | null;
  createdAt: string;
}

export function useMyDeposits() {
  return useQuery({
    queryKey: ["wallet", "deposits"],
    queryFn: () => api.get<Paginated<DepositRequest>>("/api/wallet/deposit?pageSize=20"),
    refetchInterval: 15_000
  });
}

export function useUploadDepositProof() {
  return useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadDirectToCloudinary(file, "deposit-proof");
      const res = await fetch("/api/wallet/deposit/upload", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url })
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok || !body.url) throw new Error(body.message ?? "Lưu ảnh lên thất bại.");
      return body.url;
    }
  });
}

export interface PublicPaymentSettings {
  bankName: string | null;
  bankLogoUrl: string | null;
  accountName: string | null;
  accountNumber: string | null;
  transferContent: string | null;
  qrImageUrl: string | null;
  cardInstructions: string | null;
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => api.get<{ settings: PublicPaymentSettings }>("/api/payment-settings")
  });
}

export function useWalletWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; note?: string }) => api.post("/api/wallet/withdraw", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] })
  });
}
