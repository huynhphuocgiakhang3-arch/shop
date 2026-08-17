ALTER TABLE "SiteSettings"
  ADD COLUMN "announcementEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "announcementText" TEXT,
  ADD COLUMN "heroPrimaryLine" TEXT NOT NULL DEFAULT 'Sản phẩm số.',
  ADD COLUMN "heroVariantLine" TEXT NOT NULL DEFAULT 'File/Tool hiện đại',
  ADD COLUMN "heroVaultLine" TEXT NOT NULL DEFAULT 'Đẳng cấp Vault.',
  ADD COLUMN "heroDescription" TEXT,
  ADD COLUMN "heroPrimaryCta" TEXT NOT NULL DEFAULT 'Khám phá Marketplace',
  ADD COLUMN "heroSecondaryCta" TEXT NOT NULL DEFAULT 'Mở Vault',
  ADD COLUMN "memberDisplay" TEXT,
  ADD COLUMN "fiveStarDisplay" TEXT;

UPDATE "SiteSettings"
SET
  "announcementText" = COALESCE("announcementText", 'KhangHuynh Vault • Kho File & Tool Premium'),
  "heroDescription" = COALESCE("heroDescription", 'Một không gian thương mại số được thiết kế để khám phá lâu hơn, tin tưởng nhanh hơn và mua hàng dễ hơn — từ lần chạm đầu tiên đến lúc tài sản xuất hiện trong Vault.'),
  "heroPrimaryCta" = COALESCE("heroPrimaryCta", 'Khám phá Marketplace'),
  "heroSecondaryCta" = COALESCE("heroSecondaryCta", 'Mở Vault');
