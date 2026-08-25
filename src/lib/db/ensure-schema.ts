import { Prisma, type PrismaClient } from "@prisma/client";

/**
 * Production shipped the Vault upgrade before `prisma migrate deploy`
 * ran against the live database. Prisma then SELECTs columns/tables that
 * do not exist yet (P2021/P2022) and every storefront page that uses
 * `include` or the new Product fields returns the route error card.
 *
 * This module applies the pending commerce DDL once per serverless
 * isolate (idempotent `IF NOT EXISTS` / exception-guarded enum). It is
 * invoked from the Prisma client middleware so layout + page queries
 * that race in parallel share one lock and never observe a half-migrated
 * schema.
 */

const COMMERCE_DDL = [
  `DO $$ BEGIN
     CREATE TYPE "DisplayMetricMode" AS ENUM ('AUTOMATIC', 'MANAGED');
   EXCEPTION
     WHEN duplicate_object THEN NULL;
   END $$`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBestseller" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isEditorsPick" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isLimited" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "licenseType" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "licenseTerms" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayRatingMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC'`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayRating" DECIMAL(3,2)`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayReviewCountMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC'`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayReviewCount" INTEGER`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayBuyerCountMode" "DisplayMetricMode" NOT NULL DEFAULT 'AUTOMATIC'`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "displayBuyerCount" INTEGER`,
  `CREATE INDEX IF NOT EXISTS "Product_isBestseller_idx" ON "Product"("isBestseller")`,
  `CREATE TABLE IF NOT EXISTS "Collection" (
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
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Collection_isFeatured_sortOrder_idx" ON "Collection"("isFeatured", "sortOrder")`,
  `CREATE TABLE IF NOT EXISTS "CollectionProduct" (
     "collectionId" TEXT NOT NULL,
     "productId" TEXT NOT NULL,
     "sortOrder" INTEGER NOT NULL DEFAULT 0,
     CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("collectionId","productId")
   )`,
  `CREATE INDEX IF NOT EXISTS "CollectionProduct_productId_idx" ON "CollectionProduct"("productId")`,
  `ALTER TABLE "CollectionProduct" DROP CONSTRAINT IF EXISTS "CollectionProduct_collectionId_fkey"`,
  `ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "CollectionProduct" DROP CONSTRAINT IF EXISTS "CollectionProduct_productId_fkey"`,
  `ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `CREATE TABLE IF NOT EXISTS "VaultItem" (
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
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VaultItem_userId_productId_key" ON "VaultItem"("userId", "productId")`,
  `CREATE INDEX IF NOT EXISTS "VaultItem_userId_pinned_idx" ON "VaultItem"("userId", "pinned")`,
  `ALTER TABLE "VaultItem" DROP CONSTRAINT IF EXISTS "VaultItem_userId_fkey"`,
  `ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "VaultItem" DROP CONSTRAINT IF EXISTS "VaultItem_productId_fkey"`,
  `ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE`
] as const;

let schemaReady = false;
let schemaFailed = false;
let inFlight: Promise<void> | null = null;
let applying = false;

type ExistsRow = { exists: boolean };

export function isSchemaDriftError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

export function isSchemaEnsureInProgress(): boolean {
  return applying;
}

async function columnExists(client: PrismaClient, table: string, column: string): Promise<boolean> {
  const rows = await client.$queryRaw<ExistsRow[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function tableExists(client: PrismaClient, table: string): Promise<boolean> {
  const rows = await client.$queryRaw<ExistsRow[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${table}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function applyCommerceDdl(client: PrismaClient): Promise<void> {
  for (const statement of COMMERCE_DDL) {
    await client.$executeRawUnsafe(statement);
  }
}

async function probeAndApply(client: PrismaClient): Promise<void> {
  const [hasBestseller, hasCollection, hasVaultItem] = await Promise.all([
    columnExists(client, "Product", "isBestseller"),
    tableExists(client, "Collection"),
    tableExists(client, "VaultItem")
  ]);

  if (hasBestseller && hasCollection && hasVaultItem) {
    schemaReady = true;
    return;
  }

  console.warn("[schema] Production database is missing Vault commerce columns/tables. Applying pending DDL.");
  await applyCommerceDdl(client);
  schemaReady = true;
  console.warn("[schema] Vault commerce schema is now in place.");
}

/**
 * Cheap no-op after the first success on this isolate.
 * Concurrent callers share one in-flight promise so homepage + layout
 * queries that start together do not run DDL twice.
 */
export function ensureCommerceSchema(client: PrismaClient): Promise<void> {
  if (schemaReady || schemaFailed) return Promise.resolve();
  if (inFlight) return inFlight;

  applying = true;
  inFlight = probeAndApply(client)
    .catch((error: unknown) => {
      schemaFailed = true;
      const message = error instanceof Error ? error.message : String(error);
      console.error("[schema] Failed to apply pending commerce DDL. Storefront will use legacy columns where possible.", {
        message
      });
    })
    .finally(() => {
      applying = false;
      inFlight = null;
    });

  return inFlight;
}
