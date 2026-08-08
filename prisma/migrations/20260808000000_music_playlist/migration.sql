CREATE TYPE "MusicSource" AS ENUM ('MP3', 'YOUTUBE', 'CLOUDINARY');

CREATE TABLE IF NOT EXISTS "MusicTrack" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT,
  "source" "MusicSource" NOT NULL,
  "url" TEXT NOT NULL,
  "coverUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "addedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MusicTrack_sortOrder_idx" ON "MusicTrack"("sortOrder");
CREATE INDEX IF NOT EXISTS "MusicTrack_isActive_idx" ON "MusicTrack"("isActive");
