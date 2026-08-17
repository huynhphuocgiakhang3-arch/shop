-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "heroImageUrl" TEXT,
    "loginBackgroundUrl" TEXT,
    "registerBackgroundUrl" TEXT,
    "bannerUrl" TEXT,
    "footerText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the single settings row so the app can always assume it exists.
INSERT INTO "SiteSettings" ("id", "maintenanceMode", "updatedAt")
VALUES ('singleton', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
