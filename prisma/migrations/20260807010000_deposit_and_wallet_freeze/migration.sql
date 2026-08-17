-- Adds: wallet freeze/unlock, per-transaction audit snapshot (old/new balance,
-- IP, device), and the whole QR/Card deposit request pipeline. All additive —
-- no existing column, table, or enum value is renamed or dropped, so every
-- currently-deployed API route keeps working unmodified.

-- Enums
CREATE TYPE "DepositMethod" AS ENUM ('QR_BANK', 'CARD');
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Wallet: freeze / unlock support
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "frozen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "frozenReason" TEXT;
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "frozenAt" TIMESTAMP(3);
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "frozenById" TEXT;

-- WalletTransaction: audit snapshot columns (nullable — existing rows are
-- left as NULL, nothing backfills them, nothing depends on them being set).
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "oldBalance" DECIMAL(14, 2);
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "newBalance" DECIMAL(14, 2);
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- PaymentSettings: singleton row, same shape as SiteSettings.
CREATE TABLE IF NOT EXISTS "PaymentSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "bankName" TEXT,
  "bankLogoUrl" TEXT,
  "accountName" TEXT,
  "accountNumber" TEXT,
  "transferContent" TEXT,
  "qrImageUrl" TEXT,
  "cardInstructions" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedById" TEXT,
  CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- DepositRequest
CREATE TABLE IF NOT EXISTS "DepositRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "method" "DepositMethod" NOT NULL,
  "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(14, 2) NOT NULL,
  "proofImageUrl" TEXT,
  "cardCode" TEXT,
  "note" TEXT,
  "rejectReason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "walletTransactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DepositRequest_walletTransactionId_key" ON "DepositRequest"("walletTransactionId");
CREATE INDEX IF NOT EXISTS "DepositRequest_userId_idx" ON "DepositRequest"("userId");
CREATE INDEX IF NOT EXISTS "DepositRequest_status_idx" ON "DepositRequest"("status");
CREATE INDEX IF NOT EXISTS "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");

DO $$ BEGIN
  ALTER TABLE "DepositRequest"
    ADD CONSTRAINT "DepositRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
