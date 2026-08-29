import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { rateLimit } from "@/lib/rate-limit";
import { parseCspReport } from "@/lib/security/csp-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/csp-report (F3): the browser's own CSP violation report
 * (`report-uri`, see next.config.ts). Unauthenticated by nature: the browser
 * sends this before any session context is relevant, so it's rate-limited per
 * IP like the other public route (/api/newsletter). The payload is reduced to
 * only `blocked-uri` / `violated-directive` / `document-uri` (parseCspReport
 * strips everything else, e.g. `script-sample`) before logging to Sentry,
 * which is already PII-scrubbed via `scrubAndTag`, never a new, unscrubbed
 * sink. A no-op (not an error) when Sentry is unconfigured.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit(`csp-report:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const report = parseCspReport(body);
  if (!report) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  Sentry.captureMessage(`CSP violation: ${report.violatedDirective || "unknown directive"}`, {
    level: "warning",
    tags: { blocked_uri: report.blockedUri || "unknown" },
    extra: { document_uri: report.documentUri },
  });

  // 202: acknowledged, nothing for the browser to act on.
  return NextResponse.json({ ok: true }, { status: 202 });
}
