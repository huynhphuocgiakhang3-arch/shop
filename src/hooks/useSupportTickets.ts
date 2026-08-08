import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface TicketListItem {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  updatedAt: string;
  _count: { messages: number };
}

export interface TicketMessage {
  id: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
  author: { displayName: string; avatarUrl: string | null; role: string };
}

export interface TicketDetail extends TicketListItem {
  messages: TicketMessage[];
  user: { displayName: string; email: string };
}

interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useTickets(status?: string) {
  return useQuery({
    queryKey: ["tickets", status ?? "all"],
    queryFn: () => api.get<Paginated<TicketListItem>>(`/api/support/tickets${status ? `?status=${status}` : ""}`)
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["tickets", id],
    queryFn: () => api.get<{ ticket: TicketDetail }>(`/api/support/tickets/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; body: string; priority?: string }) =>
      api.post<{ ticket: TicketDetail }>("/api/support/tickets", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] })
  });
}

export function useReplyTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post(`/api/support/tickets/${ticketId}/messages`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", ticketId] })
  });
}
