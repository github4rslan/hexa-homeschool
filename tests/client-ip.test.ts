import { describe, it, expect } from "vitest";
import { parseClientIp } from "@/lib/auth/client-ip";

describe("parseClientIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    expect(parseClientIp("203.0.113.7, 70.41.3.18, 150.172.238.178", null)).toBe(
      "203.0.113.7",
    );
    expect(parseClientIp("203.0.113.7", null)).toBe("203.0.113.7");
  });

  it("trims whitespace around the first hop", () => {
    expect(parseClientIp("  203.0.113.7 , 10.0.0.1", null)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    expect(parseClientIp(null, "198.51.100.9")).toBe("198.51.100.9");
    expect(parseClientIp("", "198.51.100.9")).toBe("198.51.100.9");
  });

  it("returns 'unknown' when no ip header is present", () => {
    expect(parseClientIp(null, null)).toBe("unknown");
    expect(parseClientIp("", "")).toBe("unknown");
    expect(parseClientIp("   ", null)).toBe("unknown");
  });
});
