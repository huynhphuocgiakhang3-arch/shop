import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireActiveUser, requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGETS = {
  "product-image": { role: "admin", folder: "khanghuynh-vault/products", resourceType: "image" as const, maxBytes: 10 * 1024 * 1024 },
  "product-file": { role: "admin", folder: "khanghuynh-vault/products/files", resourceType: "raw" as const, maxBytes: 25 * 1024 * 1024 },
  "category-banner": { role: "admin", folder: "khanghuynh-vault/categories", resourceType: "image" as const, maxBytes: 12 * 1024 * 1024 },
  "payment-asset": { role: "admin", folder: "khanghuynh-vault/payment", resourceType: "image" as const, maxBytes: 8 * 1024 * 1024 },
  "appearance": { role: "admin", folder: "khanghuynh-vault/appearance", resourceType: "image" as const, maxBytes: 8 * 1024 * 1024 },
  "deposit-proof": { role: "user", folder: "khanghuynh-vault/deposit-proof", resourceType: "image" as const, maxBytes: 8 * 1024 * 1024 }
} as const;

type Target = keyof typeof TARGETS;

function isTarget(value: unknown): value is Target {
  return typeof value === "string" && value in TARGETS;
}

function safeName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 90) || "asset";
  return base.replace(/^\.+/, "");
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const body = await req.json().catch(() => null) as { target?: unknown; fileName?: unknown; fileType?: unknown; fileSize?: unknown; slot?: unknown } | null;
  const target = body?.target;
  if (!isTarget(target)) return jsonError("Upload target không hợp lệ.", 422);

  const config = TARGETS[target];
  if (config.role === "admin") {
    const { response } = await requireSuperAdmin();
    if (response) return response;
  } else {
    const { response } = await requireActiveUser();
    if (response) return response;
  }

  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;
  if (fileSize <= 0 || fileSize > config.maxBytes) {
    return jsonError(`Tệp vượt quá giới hạn ${Math.round(config.maxBytes / 1024 / 1024)}MB.`, 413);
  }

  const fileType = typeof body?.fileType === "string" ? body.fileType : "";
  const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/x-icon", "image/svg+xml"]);
  const productTypes = new Set(["application/zip", "application/x-zip-compressed", "application/x-7z-compressed", "application/x-rar-compressed", "application/pdf", "application/octet-stream", "text/plain", "application/json", "application/x-gzip", "application/gzip"]);
  if (target === "product-image" || target === "category-banner" || target === "payment-asset" || target === "appearance" || target === "deposit-proof") {
    if (!imageTypes.has(fileType)) return jsonError("Định dạng ảnh chưa được hỗ trợ.", 415);
  }
  if (target === "product-file" && fileType && !productTypes.has(fileType)) return jsonError("Định dạng tệp chưa được hỗ trợ.", 415);

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary chưa được cấu hình.");
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    const timestamp = Math.floor(Date.now() / 1000);
    const extension = target === "product-file" ? (() => {
      const name = typeof body?.fileName === "string" ? body.fileName : "asset.bin";
      const match = name.match(/(\.[a-zA-Z0-9]{1,12})$/);
      return match?.[1]?.toLowerCase() ?? ".bin";
    })() : "";
    const baseName = safeName(typeof body?.fileName === "string" ? body.fileName.replace(/\.[^.]+$/, "") : "asset");
    const unique = `${baseName}-${crypto.randomUUID()}${extension}`;
    const slot = typeof body?.slot === "string" && /^[a-zA-Z0-9_-]{1,40}$/.test(body.slot) ? body.slot : undefined;
    const folder = slot ? `${config.folder}/${slot}` : config.folder;
    const publicId = unique;
    const paramsToSign = { folder, public_id: publicId, timestamp };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return jsonOk({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType: config.resourceType,
      maxBytes: config.maxBytes
    });
  } catch (error) {
    logApiError("uploads/sign", error);
    return jsonError("Không thể khởi tạo phiên upload.", 502);
  }
}
