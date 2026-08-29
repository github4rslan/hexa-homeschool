import { describe, expect, it } from "vitest";
import {
  REMEMBERED_SESSION_SECONDS,
  SHORT_SESSION_SECONDS,
  sessionMaxAgeSeconds,
} from "@/lib/auth/session-policy";

describe("sessionMaxAgeSeconds (B3: wire up the login Remember me checkbox)", () => {
  it("keeps today's 7-day duration, byte-for-byte, when remembered (checked, the default)", () => {
    expect(REMEMBERED_SESSION_SECONDS).toBe(60 * 60 * 24 * 7);
    expect(sessionMaxAgeSeconds(true)).toBe(REMEMBERED_SESSION_SECONDS);
  });

  it("issues a materially shorter session when a parent deliberately unchecks it", () => {
    expect(sessionMaxAgeSeconds(false)).toBe(SHORT_SESSION_SECONDS);
    expect(SHORT_SESSION_SECONDS).toBeLessThan(REMEMBERED_SESSION_SECONDS);
  });
});
