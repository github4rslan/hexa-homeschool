/**
 * Parse and reduce a browser CSP violation report (F3) to the three fields
 * that matter: `blocked-uri`, `violated-directive`, `document-uri`. Strips
 * everything else the browser sends (`script-sample`, `referrer`,
 * `status-code`, etc.) before it ever reaches a log sink, and caps each
 * field's length so a malformed or oversized report can't bloat storage.
 * Pure and testable; returns null for anything that doesn't look like a real
 * CSP report.
 */

export interface CspReportSummary {
  blockedUri: string;
  violatedDirective: string;
  documentUri: string;
}

const MAX_FIELD_LENGTH = 500;

function truncate(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Drop any query string / fragment from a URL-shaped field before it's ever
 * logged (Sentry invariant: no query strings, ever, even outside the shared
 * scrubber's usual reach). Non-URL values (e.g. `blocked-uri` can be a
 * pseudo-scheme like "inline", "eval" or "data") pass through unchanged, since
 * they carry no query string to begin with.
 */
function originAndPath(value: string): string {
  try {
    const u = new URL(value);
    return `${u.origin}${u.pathname}`;
  } catch {
    return value;
  }
}

export function parseCspReport(body: unknown): CspReportSummary | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  // The legacy `report-uri` payload wraps the fields in a "csp-report" key;
  // accept a bare object too in case a browser ever sends one unwrapped.
  const cspReport = record["csp-report"];
  const raw: Record<string, unknown> =
    cspReport && typeof cspReport === "object"
      ? (cspReport as Record<string, unknown>)
      : record;

  const blockedUri = originAndPath(truncate(raw["blocked-uri"]));
  const violatedDirective = truncate(raw["violated-directive"]);
  const documentUri = originAndPath(truncate(raw["document-uri"]));
  if (!blockedUri && !violatedDirective && !documentUri) return null;

  return { blockedUri, violatedDirective, documentUri };
}
