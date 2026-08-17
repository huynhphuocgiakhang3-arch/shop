ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "cardProvider" TEXT;
ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "cardSerial" TEXT;
CREATE INDEX IF NOT EXISTS "DepositRequest_cardProvider_cardSerial_idx" ON "DepositRequest"("cardProvider", "cardSerial");
