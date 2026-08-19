import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface ReferredUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  hasPurchased: boolean;
}

export interface ReferralMeResponse {
  referralCode: string;
  commissionPercent: number;
  enabled: boolean;
  stats: {
    totalReferred: number;
    totalConverted: number;
    totalCommission: number;
    commissionPayouts: number;
  };
  referredUsers: ReferredUser[];
}

export function useReferralMe() {
  return useQuery({
    queryKey: ["referrals", "me"],
    queryFn: () => api.get<ReferralMeResponse>("/api/referrals/me")
  });
}

export interface AdminReferralOverview {
  overview: {
    totalReferrers: number;
    totalReferred: number;
    totalCommissionPaid: number;
    totalPayouts: number;
  };
  topReferrers: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
    referredCount: number;
    commissionEarned: number;
  }[];
}

export function useAdminReferralOverview() {
  return useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: () => api.get<AdminReferralOverview>("/api/admin/referrals")
  });
}
