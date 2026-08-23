import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ChatMessageItem } from "@/hooks/useChat";

export interface AdminConversationListItem {
  id: string;
  needsHuman: boolean;
  lastMessageAt: string;
  user: { id: string; displayName: string; email: string; avatarUrl: string | null };
  lastMessage: ChatMessageItem | null;
  unreadCount: number;
}

export function useAdminConversations() {
  return useQuery({
    queryKey: ["admin", "chat", "conversations"],
    queryFn: () => api.get<{ conversations: AdminConversationListItem[] }>("/api/admin/chat/conversations"),
    refetchInterval: 5000
  });
}

export function useAdminConversation(id: string | null) {
  return useQuery({
    queryKey: ["admin", "chat", "conversation", id],
    queryFn: () =>
      api.get<{ conversation: { id: string; needsHuman: boolean; user: AdminConversationListItem["user"]; messages: ChatMessageItem[] } }>(
        `/api/admin/chat/conversations/${id}`
      ),
    enabled: Boolean(id),
    refetchInterval: id ? 4000 : false
  });
}

export function useAdminReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.post(`/api/admin/chat/conversations/${id}/messages`, { body }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin", "chat", "conversation", variables.id] });
      qc.invalidateQueries({ queryKey: ["admin", "chat", "conversations"] });
    }
  });
}

export interface ChatSettingsData {
  greetingMessage: string | null;
}

export function useChatSettings() {
  return useQuery({
    queryKey: ["admin", "chat-settings"],
    queryFn: () => api.get<{ settings: ChatSettingsData; aiSupportConfigured: boolean }>("/api/admin/chat-settings")
  });
}

export function useUpdateChatSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (greetingMessage: string) => api.patch("/api/admin/chat-settings", { greetingMessage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "chat-settings"] })
  });
}
