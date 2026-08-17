import { prisma } from "@/lib/prisma";

const DEFAULT_GREETING = "Chào {name}, không biết bạn đang gặp vấn đề hay cần tư vấn gì thì cứ mạnh dạn chat với mình nhé, sẵn sàng support 24/7";

export async function getChatSettings() {
  return prisma.chatSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", greetingMessage: DEFAULT_GREETING }
  });
}

export async function updateChatSettings(greetingMessage: string) {
  const message = greetingMessage.trim();
  if (!message) throw new Error("GREETING_EMPTY");

  return prisma.chatSettings.upsert({
    where: { id: "singleton" },
    update: { greetingMessage: message },
    create: { id: "singleton", greetingMessage: message }
  });
}

export function renderGreeting(template: string | null, displayName: string) {
  return (template?.trim() || DEFAULT_GREETING).replaceAll("{name}", displayName || "bạn");
}
