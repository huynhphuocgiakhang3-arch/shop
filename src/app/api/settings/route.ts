import { getSiteSettings, publicSiteSettings } from "@/lib/settings";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return jsonOk({ settings: publicSiteSettings(settings) });
  } catch (error) {
    return handleApiError(error, "settings:GET");
  }
}
