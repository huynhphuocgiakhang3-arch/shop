import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { updatePaymentSettings } from "@/lib/payment-settings";
import { jsonError, jsonOk, logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Which upload slot this hits — QR code image or the bank's logo.
const TARGET_FIELD = {
  qr: "qrImageUrl",
  bankLogo: "bankLogoUrl"
} as const;

type Target = keyof typeof TARGET_FIELD;

function isTarget(value: unknown): value is Target {
  return typeof value === "string" && value in TARGET_FIELD;
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireSuperAdmin();
  if (response) return response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const target = form?.get("target");

  if (!isTarget(target)) {
    return jsonError(`target phải là một trong: ${Object.keys(TARGET_FIELD).join(", ")}.`, 422);
  }
  if (!file || !(file instanceof File)) {
    return jsonError("Vui lòng chọn một tệp ảnh.", 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Định dạng ảnh không được hỗ trợ.", 415);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return jsonError("Ảnh tối đa 8MB.", 413);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadBuffer(buffer, { folder: `khanghuynh-vault/payment/${target}`, resourceType: "image" });

    const field = TARGET_FIELD[target];
    const settings = await updatePaymentSettings({ [field]: url }, user.sub);

    await prisma.auditLog.create({
      data: { userId: user.sub, action: "SUPER_ADMIN_UPLOAD_PAYMENT_ASSET", metadata: { target, url } }
    });

    return jsonOk({ settings });
  } catch (error) {
    logApiError("admin/payment-settings/upload", error);
    return jsonError("Tải ảnh lên thất bại. Vui lòng thử lại.", 502);
  }
}
