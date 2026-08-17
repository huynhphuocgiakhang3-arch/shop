import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { getPaymentSettings, updatePaymentSettings, type PaymentSettingsPatch } from "@/lib/payment-settings";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const settings = await getPaymentSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/payment-settings:GET");
  }
}

const TEXT_FIELDS = [
  "bankName",
  "bankLogoUrl",
  "accountName",
  "accountNumber",
  "transferContent",
  "qrImageUrl",
  "cardInstructions"
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Dữ liệu không hợp lệ.", 422);

    const patch: PaymentSettingsPatch = {};
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

    const settings = await updatePaymentSettings(patch, user.sub);

    await prisma.auditLog.create({
      data: { userId: user.sub, action: "SUPER_ADMIN_UPDATE_PAYMENT_SETTINGS", metadata: patch }
    });

    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/payment-settings:PATCH");
  }
}
