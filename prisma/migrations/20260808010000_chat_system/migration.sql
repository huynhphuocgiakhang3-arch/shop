CREATE TYPE "MessageSender" AS ENUM ('USER', 'ADMIN', 'BOT');

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "needsHuman" BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_userId_key" ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_needsHuman_idx" ON "Conversation"("needsHuman");

DO $$ BEGIN
  ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "sender" "MessageSender" NOT NULL,
  "senderId" TEXT,
  "body" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "readByUserAt" TIMESTAMP(3),
  "readByAdminAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ChatSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "greetingMessage" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSettings_pkey" PRIMARY KEY ("id")
);
