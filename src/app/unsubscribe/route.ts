import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import {
  unsubscribePageHtml,
  UNSUBSCRIBE_DONE,
  UNSUBSCRIBE_EXPIRED,
} from "@/lib/email/unsubscribe-page";
import { setMarketingEmailsOptOut } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Login-less one-click unsubscribe for MARKETING email (re-engagement series).
 *
 * GET  — a parent clicking the footer link: opt them out, then render a calm
 *        on-brand confirmation page. Single-purpose: the signed token grants
 *        nothing but "opt THIS parent out of marketing".
 * POST — RFC 8058 List-Unsubscribe-Post one-click (Gmail/Apple Mail send this
 *        automatically): opt out, return 200 with no body.
 *
 * Honours idempotency (opting out twice is harmless) and never touches account
 * or safety email — only `marketing_emails_opt_out`.
 */

function page(spec: { title: string; message: string; ok: boolean }): Response {
  return new Response(unsubscribePageHtml(spec), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function optOut(token: string | null): Promise<boolean> {
  if (!token) return false;
  const parentId = await verifyUnsubscribeToken(token);
  if (!parentId) return false;
  await setMarketingEmailsOptOut(parentId, true);
  return true;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const ok = await optOut(token);
  return page(ok ? UNSUBSCRIBE_DONE : UNSUBSCRIBE_EXPIRED);
}

export async function POST(request: Request) {
  // RFC 8058 one-click: the token is in the query string of the List-Unsubscribe URL.
  const token = new URL(request.url).searchParams.get("token");
  const ok = await optOut(token);
  return new Response(null, { status: ok ? 200 : 400 });
}
