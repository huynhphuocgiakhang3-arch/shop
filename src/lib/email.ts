const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends mail when `RESEND_API_KEY` is set. Otherwise logs and returns
 * `{ sent: false }` — callers must not pretend the inbox received anything.
 */
export async function sendTransactionalEmail(input: TransactionalEmail): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "KhangHuynh Vault <noreply@khanghuynhvault.vercel.app>";

  if (!apiKey) {
    console.info(`[email] skipped (RESEND_API_KEY unset): ${input.subject} -> ${input.to}`);
    return { sent: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text.replace(/\n/g, "<br/>")}</p>`
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[email] Resend rejected the message", { status: response.status, detail });
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send", error);
    return { sent: false };
  }
}

export function resetPasswordUrl(token: string) {
  return `${SITE_URL}/dat-lai-mat-khau?token=${encodeURIComponent(token)}`;
}

export function orderUrl(orderId: string) {
  return `${SITE_URL}/don-hang/${orderId}`;
}
