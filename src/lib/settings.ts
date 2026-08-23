import { prisma } from "@/lib/prisma";

/**
 * Reads the single SiteSettings row, creating it on first access if the
 * migration seed somehow didn't run. Always safe to call — never throws for
 * "row missing".
 */
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.siteSettings.create({ data: { id: "singleton" } });
}

// Derived from the actual Prisma call's return type rather than
// `import type { SiteSettings } from "@prisma/client"`. Functionally
// identical, but doesn't depend on TypeScript resolving that specific named
// export out of the (very large, generated) Prisma client declaration file.
export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

export type SiteSettingsPatch = Partial<
  Pick<
    SiteSettings,
    | "maintenanceMode"
    | "maintenanceMessage"
    | "logoUrl"
    | "faviconUrl"
    | "heroImageUrl"
    | "loginBackgroundUrl"
    | "registerBackgroundUrl"
    | "bannerUrl"
    | "footerText"
    | "announcementEnabled"
    | "announcementText"
    | "heroPrimaryLine"
    | "heroVariantLine"
    | "heroVaultLine"
    | "heroDescription"
    | "heroDescriptionColor"
    | "heroHeadlineColor"
    | "heroPrimaryCta"
    | "heroSecondaryCta"
    | "memberDisplay"
    | "fiveStarDisplay"
    | "referralEnabled"
    | "referralCommissionPercent"
  >
>;

export async function updateSiteSettings(patch: SiteSettingsPatch, updatedById: string): Promise<SiteSettings> {
  // Ensure the row exists first (upsert-style) so a fresh DB never 500s here.
  await getSiteSettings();
  return prisma.siteSettings.update({
    where: { id: "singleton" },
    data: { ...patch, updatedById }
  });
}

/** Public-safe subset — never leak `updatedById` etc. to anonymous visitors. */
export function publicSiteSettings(settings: SiteSettings) {
  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    heroImageUrl: settings.heroImageUrl,
    loginBackgroundUrl: settings.loginBackgroundUrl,
    registerBackgroundUrl: settings.registerBackgroundUrl,
    bannerUrl: settings.bannerUrl,
    footerText: settings.footerText,
    announcementEnabled: settings.announcementEnabled,
    announcementText: settings.announcementText,
    heroPrimaryLine: settings.heroPrimaryLine,
    heroVariantLine: settings.heroVariantLine,
    heroVaultLine: settings.heroVaultLine,
    heroDescription: settings.heroDescription,
    heroDescriptionColor: settings.heroDescriptionColor,
    heroHeadlineColor: settings.heroHeadlineColor,
    heroPrimaryCta: settings.heroPrimaryCta,
    heroSecondaryCta: settings.heroSecondaryCta,
    memberDisplay: settings.memberDisplay,
    fiveStarDisplay: settings.fiveStarDisplay,
    referralEnabled: settings.referralEnabled,
    referralCommissionPercent: settings.referralCommissionPercent
  };
}
