import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { jsonError, jsonOk, logApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return jsonError("Vui lòng chọn một tệp ảnh.", 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Chỉ chấp nhận ảnh PNG, JPEG hoặc WEBP.", 415);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return jsonError("Ảnh đại diện tối đa 5MB.", 413);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadBuffer(buffer, { folder: "khanghuynh-vault/avatars", resourceType: "image" });

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { avatarUrl: url },
      select: { avatarUrl: true }
    });

    return jsonOk({ avatarUrl: updated.avatarUrl });
  } catch (error) {
    logApiError("users/me/avatar", error);
    return jsonError("Tải ảnh lên thất bại. Vui lòng thử lại.", 502);
  }
}
