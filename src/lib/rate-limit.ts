import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Fixed-window rate limiter for paid-API and abuse-prone routes.
 *
 * When `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, limits
 * are enforced in Upstash Redis (REST, serverless-friendly) and therefore
 * SHARED across all Vercel instances. When unset — or if Upstash errors at
 * runtime — we fall back to the original per-instance in-memory limiter, so
 * the route never crashes and always has at least per-instance protection.
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

function memoryRateLimit(
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

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

// One Ratelimit instance per (limit, window) pair — they are stateless
// wrappers around the shared Redis client.
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: "hexa-rl",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Count one hit for `key` (e.g. "tutor:<parentId>") against `limit` per
 * `windowMs`. Returns `ok: false` once the window's budget is spent.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    try {
      const res = await limiter.limit(key);
      if (res.success) return { ok: true, retryAfterSeconds: 0 };
      return {
        ok: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((res.reset - Date.now()) / 1000),
        ),
      };
    } catch (err) {
      // Upstash being down must never take the route down with it.
      console.error("[rate-limit] Upstash error; using in-memory fallback:", err);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}
