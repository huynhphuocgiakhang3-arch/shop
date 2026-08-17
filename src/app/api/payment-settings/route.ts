import { getPaymentSettings, publicPaymentSettings } from "@/lib/payment-settings";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public — any logged-in or anonymous visitor can read the current bank/QR
// display info. No secrets live on this row, so no auth guard is needed.
export async function GET() {
  try {
    const settings = await getPaymentSettings();
    return jsonOk({ settings: publicPaymentSettings(settings) });
  } catch (error) {
    return handleApiError(error, "payment-settings:GET");
  }
}
