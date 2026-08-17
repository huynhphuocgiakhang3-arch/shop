import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { jsonError, jsonOk, logApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Just the upload step — returns a Cloudinary URL the client then submits as
// `proofImageUrl` in POST /api/wallet/deposit. Kept separate from the deposit
// creation route so a failed/retried upload never creates a duplicate
// PENDING deposit request.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

  const { user, response } = await requireActiveUser();
  if (response) return response;

  const limit = rateLimit(`wallet-deposit-upload:${user.sub}:${clientIp(req)}`, 20, 60_000);
  if (!limit.allowed) return jsonError("Bạn thao tác quá nhanh. Vui lòng thử lại sau.", 429);

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null) as { url?: unknown } | null;
    if (typeof body?.url !== "string") return jsonError("Thiếu URL ảnh chứng từ.", 400);
    return jsonOk({ url: body.url });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) return jsonError("Vui lòng chọn một tệp ảnh.", 400);
  if (!ALLOWED_TYPES.has(file.type)) return jsonError("Định dạng ảnh không được hỗ trợ.", 415);
  if (file.size > MAX_SIZE_BYTES) return jsonError("Ảnh tối đa 8MB.", 413);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadBuffer(buffer, { folder: `khanghuynh-vault/deposit-proof/${user.sub}`, resourceType: "image" });
    return jsonOk({ url });
  } catch (error) {
    logApiError("wallet/deposit/upload", error);
    return jsonError("Tải ảnh lên thất bại. Vui lòng thử lại.", 502);
  }
}
