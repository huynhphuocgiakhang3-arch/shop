/**
 * Optional real-LLM fallback for the support chat bot.
 *
 * The existing keyword-matching bot (`chat-bot.ts`) already handles the
 * large majority of real questions fast, for free, and grounded in actual
 * database state (wallet balance, orders, coupons...) — that stays exactly
 * as-is and is tried first. This module only kicks in for the remaining
 * slice of messages that don't match any keyword group, where the old
 * behavior was an immediate hand-off to a human admin. Instead, if an API
 * key is configured, it asks Claude for a genuinely helpful answer first;
 * a human is still looped in if the model can't help either.
 *
 * Fully optional and fails safe: with no `ANTHROPIC_API_KEY` set (the
 * default, out of the box), this module is never called — see the guard in
 * `chat-bot.ts`. Any error, timeout, or missing key simply falls back to
 * the previous hand-off message; a misconfigured or exhausted API key can
 * never break the chat for a customer.
 */

const SYSTEM_PROMPT = `Bạn là trợ lý hỗ trợ khách hàng của KhangHuynh Vault — một marketplace bán sản phẩm số (template, tool, tài khoản, khóa học...) tại Việt Nam.

Quy tắc trả lời:
- Trả lời ngắn gọn (tối đa 3-4 câu), bằng tiếng Việt, giọng thân thiện, chuyên nghiệp.
- Không bịa đặt thông tin cụ thể (giá, số dư, trạng thái đơn hàng...) — nếu câu hỏi cần dữ liệu cá nhân/thời gian thực mà bạn không có, hãy đề nghị khách kiểm tra trong mục tương ứng trên web hoặc chờ Admin hỗ trợ.
- Nếu câu hỏi nằm ngoài phạm vi mua sắm/tài khoản/thanh toán/sản phẩm số, hoặc là khiếu nại/tranh chấp nghiêm trọng, hãy lịch sự cho biết sẽ chuyển tới Admin.
- Không đưa ra lời khuyên tài chính, pháp lý, hoặc y tế.
- Không bao giờ tiết lộ bạn là Claude/Anthropic hay chi tiết kỹ thuật hệ thống — chỉ giới thiệu là "trợ lý hỗ trợ của KhangHuynh Vault".`;

export interface AiFallbackResult {
  body: string;
  handedOff: boolean;
}

export function isAiSupportConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateAiFallbackReply(userMessage: string): Promise<AiFallbackResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_CHAT_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage.slice(0, 1000) }]
      }),
      signal: controller.signal
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text?.trim();
    if (!text) return null;

    // A model that says it can't help is still a valid "hand off" signal —
    // detect the phrase we asked it to use and route to a human either way.
    const handedOff = /chuyển.*(tới|đến).{0,10}admin|liên hệ admin/i.test(text);
    return { body: text, handedOff };
  } catch {
    // Timeout, network error, invalid key, rate limit — any failure here
    // is silently absorbed; the caller falls back to the deterministic reply.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
