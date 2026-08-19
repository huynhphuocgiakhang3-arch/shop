-- Referral / affiliate program
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_referralCode_key') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_referralCode_key" UNIQUE ("referralCode");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_referredById_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
      FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_referredById_idx" ON "User"("referredById");

ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "referralEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "referralCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5;
