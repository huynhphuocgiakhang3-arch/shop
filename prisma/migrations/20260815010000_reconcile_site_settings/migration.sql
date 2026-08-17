-- Production-safe reconciliation for SiteSettings.
-- Some environments may have the vault_experience migration recorded as applied
-- while one or more columns were not actually present in the database.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='announcementEnabled') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "announcementEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='announcementText') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "announcementText" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroPrimaryLine') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroPrimaryLine" TEXT NOT NULL DEFAULT 'Sản phẩm số.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroVariantLine') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroVariantLine" TEXT NOT NULL DEFAULT 'File/Tool hiện đại';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroVaultLine') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroVaultLine" TEXT NOT NULL DEFAULT 'Đẳng cấp Vault.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroDescription') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroDescription" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroPrimaryCta') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroPrimaryCta" TEXT NOT NULL DEFAULT 'Khám phá Marketplace';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='heroSecondaryCta') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "heroSecondaryCta" TEXT NOT NULL DEFAULT 'Mở Vault';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='memberDisplay') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "memberDisplay" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SiteSettings' AND column_name='fiveStarDisplay') THEN
    ALTER TABLE "SiteSettings" ADD COLUMN "fiveStarDisplay" TEXT;
  END IF;
END $$;

UPDATE "SiteSettings"
SET
  "announcementText" = COALESCE("announcementText", 'KhangHuynh Vault • Kho File & Tool Premium'),
  "heroDescription" = COALESCE("heroDescription", 'Một không gian thương mại số được thiết kế để khám phá lâu hơn, tin tưởng nhanh hơn và mua hàng dễ hơn — từ lần chạm đầu tiên đến lúc tài sản xuất hiện trong Vault.'),
  "heroPrimaryCta" = COALESCE("heroPrimaryCta", 'Khám phá Marketplace'),
  "heroSecondaryCta" = COALESCE("heroSecondaryCta", 'Mở Vault');
