import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { updateSiteSettings, type SiteSettingsPatch } from "@/lib/settings";
import { jsonError, jsonOk, logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/svg+xml"]);

// Which Appearance slot a given upload targets, and which settings column it
// writes to.
const TARGET_FIELD = {
  logo: "logoUrl",
  favicon: "faviconUrl",
  hero: "heroImageUrl",
  loginBackground: "loginBackgroundUrl",
  registerBackground: "registerBackgroundUrl",
  banner: "bannerUrl"
} as const;

type Target = keyof typeof TARGET_FIELD;

function isTarget(value: unknown): value is Target {
  return typeof value === "string" && value in TARGET_FIELD;
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireSuperAdmin();
  if (response) return response;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null) as { target?: unknown; url?: unknown; publicId?: unknown } | null;
    if (!isTarget(body?.target) || typeof body?.url !== "string") return jsonError("Thiếu thông tin asset.", 400);
    const field = TARGET_FIELD[body.target];
    const patch: SiteSettingsPatch = {};
    patch[field] = body.url;
    const settings = await updateSiteSettings(patch, user.sub);
    await prisma.auditLog.create({ data: { userId: user.sub, action: "SUPER_ADMIN_UPLOAD_APPEARANCE", metadata: { target: body.target, url: body.url, publicId: body.publicId } } });
    return jsonOk({ settings });
  }

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
    const { url } = await uploadBuffer(buffer, { folder: `khanghuynh-vault/appearance/${target}`, resourceType: "image" });

    const field = TARGET_FIELD[target];
    const patch: SiteSettingsPatch = {};
    patch[field] = url;
    const settings = await updateSiteSettings(patch, user.sub);

    await prisma.auditLog.create({
      data: { userId: user.sub, action: "SUPER_ADMIN_UPLOAD_APPEARANCE", metadata: { target, url } }
    });

    return jsonOk({ settings });
  } catch (error) {
    logApiError("admin/settings/upload", error);
    return jsonError("Tải ảnh lên thất bại. Vui lòng thử lại.", 502);
  }
}

// Remove a previously-uploaded image (revert that slot to default/none).
export async function DELETE(req: NextRequest) {
  const { user, response } = await requireSuperAdmin();
  if (response) return response;

  const body = await req.json().catch(() => null);
  const target = body?.target;
  if (!isTarget(target)) {
    return jsonError(`target phải là một trong: ${Object.keys(TARGET_FIELD).join(", ")}.`, 422);
  }

  const field = TARGET_FIELD[target];
  const patch: SiteSettingsPatch = {};
  patch[field] = null;
  const settings = await updateSiteSettings(patch, user.sub);

  await prisma.auditLog.create({
    data: { userId: user.sub, action: "SUPER_ADMIN_REMOVE_APPEARANCE", metadata: { target } }
  });

  return jsonOk({ settings });
}
