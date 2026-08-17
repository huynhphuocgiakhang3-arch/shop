-- AlterTable: add the two ban-related columns to "User" that exist in
-- schema.prisma but were missing from the actual production database
-- (confirmed via information_schema.columns query — the original init
-- migration never actually created them on this DB instance).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
