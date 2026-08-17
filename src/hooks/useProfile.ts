import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  membershipTier: "FREE" | "SILVER" | "GOLD" | "DIAMOND";
  rewardPoints: number;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    // silent: true — a 401 here just means "guest, not logged in", which is
    // a normal state on public pages (home, product listing, product detail,
    // search, categories). It must NEVER force-redirect to /dang-nhap.
    queryFn: () => api.get<{ user: CurrentUser }>("/api/auth/me", { silent: true }),
    retry: false,
    // A 401 is an expected outcome, not a transient failure — don't let
    // react-query treat it as "stale/error" and refetch aggressively.
    staleTime: 60_000,
    // /api/auth/me always reads the role fresh from Postgres (see route),
    // so polling it is what makes a role edited directly in Neon show up
    // in the UI (e.g. an "Admin" link appearing) within a few seconds
    // instead of only after the next full page load.
    refetchInterval: 5_000,
    refetchIntervalInBackground: false
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { displayName?: string; avatarUrl?: string }) => api.patch("/api/users/me", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] })
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: form, credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "Tải ảnh lên thất bại.");
      return body as { avatarUrl: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] })
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      api.post("/api/auth/change-password", input)
  });
}

export function useSessions() {
  return useQuery({ queryKey: ["sessions"], queryFn: () => api.get<{ sessions: Session[] }>("/api/auth/sessions") });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/auth/sessions?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] })
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => api.delete("/api/auth/account", { password })
  });
}
