import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/zip", "application/x-zip-compressed", "application/x-7z-compressed", "application/x-rar-compressed",
  "application/pdf", "application/octet-stream", "text/plain", "application/json", "application/x-gzip", "application/gzip"
]);

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);
  const { response } = await requireSuperAdmin();
  if (response) return response;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null) as { url?: unknown; publicId?: unknown; fileName?: unknown; sizeMb?: unknown } | null;
    if (typeof body?.url !== "string" || typeof body.publicId !== "string") return jsonError("Thiếu thông tin asset upload.", 400);
    return jsonOk({ url: body.url, publicId: body.publicId, fileName: typeof body.fileName === "string" ? body.fileName : undefined, sizeMb: typeof body.sizeMb === "number" ? body.sizeMb : undefined });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("Vui lòng chọn tệp sản phẩm.", 400);
  if (file.size > MAX_SIZE_BYTES) return jsonError("Tệp tải trực tiếp tối đa 25MB. Tệp lớn hơn hãy dùng URL lưu trữ riêng.", 413);
  if (file.type && !ALLOWED_TYPES.has(file.type)) return jsonError("Định dạng tệp chưa được hỗ trợ.", 415);
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, { folder: "khanghuynh-vault/products/files", resourceType: "raw" });
    return jsonOk({ url: result.url, publicId: result.publicId, fileName: file.name, sizeMb: Math.max(1, Math.round(file.size / 1024 / 1024)) });
  } catch (error) {
    logApiError("admin/products/upload-file", error);
    return jsonError("Tải tệp sản phẩm lên thất bại. Kiểm tra Cloudinary rồi thử lại.", 502);
  }
}
