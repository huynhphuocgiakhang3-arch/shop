import { prisma } from "@/lib/prisma";

/**
 * Reads the single PaymentSettings row, creating it on first access if it
 * doesn't exist yet. Always safe to call — never throws for "row missing".
 */
export async function getPaymentSettings() {
  const existing = await prisma.paymentSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.paymentSettings.create({ data: { id: "singleton" } });
}

export type PaymentSettings = Awaited<ReturnType<typeof getPaymentSettings>>;

export type PaymentSettingsPatch = Partial<
  Pick<
    PaymentSettings,
    "bankName" | "bankLogoUrl" | "accountName" | "accountNumber" | "transferContent" | "qrImageUrl" | "cardInstructions"
  >
>;

export async function updatePaymentSettings(patch: PaymentSettingsPatch, updatedById: string): Promise<PaymentSettings> {
  await getPaymentSettings();
  return prisma.paymentSettings.update({
    where: { id: "singleton" },
    data: { ...patch, updatedById }
  });
}

/** Public-safe subset shown on the deposit page — never leaks `updatedById`. */
export function publicPaymentSettings(settings: PaymentSettings) {
  return {
    bankName: settings.bankName,
    bankLogoUrl: settings.bankLogoUrl,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    transferContent: settings.transferContent,
    qrImageUrl: settings.qrImageUrl,
    cardInstructions: settings.cardInstructions
  };
}

/** Whether QR deposits can actually be shown — no point rendering a blank QR panel. */
export function isPaymentSettingsConfigured(settings: PaymentSettings) {
  return Boolean(settings.accountNumber && settings.bankName);
}
