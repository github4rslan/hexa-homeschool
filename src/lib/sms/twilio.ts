import "server-only";

/**
 * Minimal Twilio SMS sender (REST, no SDK), mirroring the Brevo email pattern.
 *
 * Unset Twilio env (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`) =
 * graceful no-op returning { skipped: true } — the app never breaks before SMS
 * is configured. Sends are best-effort: failures are logged, never thrown.
 */

export function smsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  );
}

export interface SmsResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[sms] Twilio error:", res.status, detail.slice(0, 200));
      return { ok: false, error: `Twilio ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[sms] send failed:", err);
    return { ok: false, error: "send failed" };
  }
}
