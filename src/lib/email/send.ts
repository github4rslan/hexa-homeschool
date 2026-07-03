import "server-only";

/**
 * Minimal Brevo (Sendinblue) email sender (REST, no SDK).
 *
 * If BREVO_API_KEY is not set, send() is a graceful no-op that returns
 * { skipped: true } — so the app never breaks before email is configured, and
 * verification logic can treat "email not configured" as auto-pass to avoid
 * locking anyone out. Once the key is added, real sending kicks in.
 *
 * Brevo free tier sends to ANY recipient once a sender (single email or a
 * domain) is verified — unlike Resend's test mode, which only delivers to your
 * own account address.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function emailConfigured(): boolean {
  return !!process.env.BREVO_API_KEY;
}

/** Parse EMAIL_FROM ("Edway <hello@edway.uk>" or "hello@edway.uk"). */
function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM || "Edway <hello@edway.uk>";
  const m = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1] || "Edway", email: m[2] };
  return { name: "Edway", email: raw.trim() };
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback (Brevo `textContent`). */
  text?: string;
  /**
   * Optional custom SMTP headers (Brevo `headers`). Used to attach a
   * `List-Unsubscribe` / `List-Unsubscribe-Post` pair to marketing email so
   * Gmail/Apple Mail render a native one-click unsubscribe (RFC 8058).
   */
  headers?: Record<string, string>;
}): Promise<SendResult> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn("[email] BREVO_API_KEY not set — skipping send to", input.to);
    return { ok: false, skipped: true };
  }
  const sender = parseSender();
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        ...(input.text ? { textContent: input.text } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[email] Brevo error:", res.status, detail.slice(0, 200));
      return { ok: false, error: `Brevo ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: "send failed" };
  }
}
