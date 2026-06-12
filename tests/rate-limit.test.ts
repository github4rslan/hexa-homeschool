import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

// The limiter keeps a module-level Map across tests — every test uses its own
// key so buckets never bleed between cases. Upstash env vars are unset in
// tests, so these exercise the in-memory fallback path.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-12T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests under the limit", async () => {
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit("t:under", 3, 60_000);
      expect(r.ok).toBe(true);
      expect(r.retryAfterSeconds).toBe(0);
    }
  });

  it("blocks once the limit is spent and reports a retry delay", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("t:block", 5, 60_000);
    const blocked = await rateLimit("t:block", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("resets after the window passes", async () => {
    for (let i = 0; i < 2; i++) await rateLimit("t:reset", 2, 60_000);
    expect((await rateLimit("t:reset", 2, 60_000)).ok).toBe(false);

    vi.advanceTimersByTime(60_001);
    const after = await rateLimit("t:reset", 2, 60_000);
    expect(after.ok).toBe(true);
    expect(after.retryAfterSeconds).toBe(0);
  });

  it("keeps keys independent", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("t:user-a", 3, 60_000);
    expect((await rateLimit("t:user-a", 3, 60_000)).ok).toBe(false);
    expect((await rateLimit("t:user-b", 3, 60_000)).ok).toBe(true);
  });

  it("counts the blocked attempt against nothing (window unchanged)", async () => {
    await rateLimit("t:fixed", 1, 60_000);
    expect((await rateLimit("t:fixed", 1, 60_000)).ok).toBe(false);
    // 30s later the window has NOT moved (fixed window, not sliding).
    vi.advanceTimersByTime(30_000);
    const r = await rateLimit("t:fixed", 1, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSeconds).toBeLessThanOrEqual(30);
  });
});
