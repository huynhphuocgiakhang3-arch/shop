import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { getChatSettings, updateChatSettings } from "@/lib/chat-settings";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const settings = await getChatSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/chat-settings:GET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const greetingMessage = typeof body?.greetingMessage === "string" ? body.greetingMessage.trim() : "";
    if (!greetingMessage) return jsonError("Vui lòng nhập nội dung chào mừng.", 422);
    if (greetingMessage.length > 2000) return jsonError("Tin nhắn chào mừng tối đa 2000 ký tự.", 422);

    const settings = await updateChatSettings(greetingMessage);
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error, "admin/chat-settings:PATCH");
  }
}
