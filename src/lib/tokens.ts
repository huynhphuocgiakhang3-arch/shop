import { randomBytes } from "crypto";

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function generateOrderNumber(): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `KHV-${stamp}-${rand}`;
}
