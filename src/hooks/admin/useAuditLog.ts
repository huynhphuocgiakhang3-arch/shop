import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AuditLogEntry {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
  user: { displayName: string; email: string } | null;
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useAuditLog(page = 1, action?: string) {
  return useQuery({
    queryKey: ["admin", "audit-log", page, action ?? ""],
    queryFn: () => api.get<Paginated<AuditLogEntry>>(`/api/admin/audit-log?page=${page}${action ? `&action=${encodeURIComponent(action)}` : ""}`)
  });
}
