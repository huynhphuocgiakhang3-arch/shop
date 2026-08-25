-- CreateEnum
CREATE TYPE "DisplayMetricMode" AS ENUM ('AUTOMATIC', 'MANAGED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBestseller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isEditorsPick" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isLimited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "licenseTerms" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayRatingMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayRating" DECIMAL(3,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayReviewCountMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayReviewCount" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayBuyerCountMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayBuyerCount" INTEGER;

CREATE INDEX IF NOT EXISTS "Product_isBestseller_idx" ON "Product"("isBestseller");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX IF NOT EXISTS "Collection_isFeatured_sortOrder_idx" ON "Collection"("isFeatured", "sortOrder");

-- CreateTable
CREATE TABLE IF NOT EXISTS "CollectionProduct" (
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("collectionId","productId")
);

CREATE INDEX IF NOT EXISTS "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");

ALTER TABLE "CollectionProduct" DROP CONSTRAINT IF EXISTS "CollectionProduct_collectionId_fkey";
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionProduct" DROP CONSTRAINT IF EXISTS "CollectionProduct_productId_fkey";
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE IF NOT EXISTS "VaultItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VaultItem_userId_productId_key" ON "VaultItem"("userId", "productId");
CREATE INDEX IF NOT EXISTS "VaultItem_userId_pinned_idx" ON "VaultItem"("userId", "pinned");

ALTER TABLE "VaultItem" DROP CONSTRAINT IF EXISTS "VaultItem_userId_fkey";
ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaultItem" DROP CONSTRAINT IF EXISTS "VaultItem_productId_fkey";
ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
