import { randomBytes } from "crypto";

export function generateLicenseKey(): string {
  const raw = randomBytes(8).toString("hex").toUpperCase();
  return `KHV-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}
