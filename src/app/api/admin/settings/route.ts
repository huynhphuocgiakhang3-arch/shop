import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { getSiteSettings, updateSiteSettings, type SiteSettingsPatch } from "@/lib/settings";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Full settings row (SUPER_ADMIN only — plain ADMIN cannot see or touch
// Maintenance Mode / Appearance / system settings per the platform's access
// model in BƯỚC 5).
export async function GET() {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const settings = await getSiteSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/settings:GET");
  }
}

const TEXT_FIELDS = [
  "maintenanceMessage",
  "logoUrl",
  "faviconUrl",
  "heroImageUrl",
  "loginBackgroundUrl",
  "registerBackgroundUrl",
  "bannerUrl",
  "footerText",
  "announcementText",
  "heroPrimaryLine",
  "heroVariantLine",
  "heroVaultLine",
  "heroDescription",
  "heroPrimaryCta",
  "heroSecondaryCta",
  "memberDisplay",
  "fiveStarDisplay"
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Dữ liệu không hợp lệ.", 422);

    const patch: SiteSettingsPatch = {};

    if ("announcementEnabled" in body) {
      if (typeof body.announcementEnabled !== "boolean") return jsonError("announcementEnabled phải là true/false.", 422);
      patch.announcementEnabled = body.announcementEnabled;
    }

    if ("referralEnabled" in body) {
      if (typeof body.referralEnabled !== "boolean") return jsonError("referralEnabled phải là true/false.", 422);
      patch.referralEnabled = body.referralEnabled;
    }

    if ("referralCommissionPercent" in body) {
      const value = Number(body.referralCommissionPercent);
      if (!Number.isFinite(value) || value < 0 || value > 50) {
        return jsonError("Tỷ lệ hoa hồng giới thiệu phải từ 0 đến 50%.", 422);
      }
      patch.referralCommissionPercent = value;
    }

    if ("maintenanceMode" in body) {
      if (typeof body.maintenanceMode !== "boolean") {
        return jsonError("maintenanceMode phải là true/false.", 422);
      }
      patch.maintenanceMode = body.maintenanceMode;
    }

    for (const field of TEXT_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (value !== null && typeof value !== "string") {
          return jsonError(`${field} không hợp lệ.`, 422);
        }
        patch[field] = value === "" ? null : value;
      }
    }

    if (Object.keys(patch).length === 0) {
      return jsonError("Không có thay đổi nào được gửi lên.", 422);
    }

    const settings = await updateSiteSettings(patch, user.sub);

    await prisma.auditLog.create({
      data: { userId: user.sub, action: "SUPER_ADMIN_UPDATE_SETTINGS", metadata: patch }
    });

    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/settings:PATCH");
  }
}
