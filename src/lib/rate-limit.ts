import "server-only";

/**
 * Minimal fixed-window, in-memory rate limiter for paid-API routes.
 *
 * Scope: per serverless instance (Vercel may run several concurrently), so the
 * effective ceiling is `limit × instances`. That is acceptable as a first gate
 * against credit-burning abuse; move to a shared store (e.g. Atlas or Upstash)
 * if cross-instance enforcement becomes necessary.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

/** Keep the map bounded on long-lived instances. */
function pruneExpired(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Whole seconds until the window resets; 0 when `ok`. */
  retryAfterSeconds: number;
}

/**
 * Count one hit for `key` (e.g. "tutor:<parentId>") against `limit` per
 * `windowMs`. Returns `ok: false` once the window's budget is spent.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return { ok: true, retryAfterSeconds: 0 };
  }

  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
