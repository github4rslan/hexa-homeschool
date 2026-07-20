/**
 * Open-redirect guard for post-auth `?redirect=` targets. Pure (no DB, no
 * `server-only`) so it's unit-tested in tests/.
 *
 * A value is a safe *internal* destination only if it is an absolute path on
 * this site: it must start with a single "/", must NOT start with "//" or "/\"
 * (protocol-relative URLs that browsers treat as external hosts), and must not
 * contain backslashes, whitespace or control characters that could be used to
 * smuggle a scheme/host. Anything else returns null so the caller falls back to
 * its role default. Never trust the raw param as a redirect target.
 */
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]");

export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (v.length === 0) return null;
  // Must be an absolute in-site path.
  if (!v.startsWith("/")) return null;
  // Protocol-relative ("//evil.com") or "/\evil.com" escape to another host.
  if (v.startsWith("//") || v.startsWith("/\\")) return null;
  // Backslashes or whitespace can smuggle a host/scheme.
  if (/[\\\s]/.test(v)) return null;
  // Control characters (incl. NUL) are never legitimate in a path.
  if (CONTROL_CHARS.test(v)) return null;
  return v;
}
