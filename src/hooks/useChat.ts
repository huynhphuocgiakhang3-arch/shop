import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface ChatMessageItem {
  id: string;
  sender: "USER" | "ADMIN" | "BOT";
  senderId?: string | null;
  body: string;
  attachmentUrl: string | null;
  readByUserAt: string | null;
  createdAt: string;
}

interface ConversationResponse {
  conversation: { id: string; needsHuman: boolean };
  admin: { displayName: string; avatarUrl: string | null };
  messages: ChatMessageItem[];
}

export function useConversation(enabled: boolean) {
  return useQuery({
    queryKey: ["chat", "conversation"],
    queryFn: () => api.get<ConversationResponse>("/api/chat/conversation"),
    enabled,
    refetchInterval: enabled ? 4000 : false
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; attachmentUrl?: string }) => api.post("/api/chat/messages", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "conversation"] })
  });
}

export function useMarkChatRead() {
  return useMutation({ mutationFn: () => api.post("/api/chat/read") });
}
