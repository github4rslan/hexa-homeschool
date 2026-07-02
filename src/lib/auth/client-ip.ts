import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort client IP for coarse per-IP rate limiting of the auth server
 * actions. Prefers the first hop of `x-forwarded-for` (what Vercel sets),
 * falling back to `x-real-ip`. Never throws; returns "unknown" when no header
 * is present (all such callers then share one bucket, which is acceptable for a
 * throttle floor).
 */
export function parseClientIp(
  forwardedFor: string | null,
  realIp: string | null,
): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = realIp?.trim();
  return real || "unknown";
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return parseClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}
