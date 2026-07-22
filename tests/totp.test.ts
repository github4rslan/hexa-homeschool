import { describe, it, expect } from "vitest";
import {
  base32Encode,
  base32Decode,
  totpCode,
  verifyTotp,
  otpauthUri,
  generateTotpSecret,
  generateRecoveryCodes,
  normalizeRecoveryCode,
  hashRecoveryCode,
} from "@/lib/auth/totp";

// RFC 6238 test seed "12345678901234567890" (ASCII) in base32.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

describe("base32", () => {
  it("round-trips arbitrary bytes", () => {
    const b = Buffer.from("hello world", "utf8");
    expect(base32Decode(base32Encode(b)).equals(b)).toBe(true);
  });

  it("encodes the RFC ascii seed to the known base32", () => {
    expect(RFC_SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  it("is tolerant of spaces / lowercase / padding on decode", () => {
    const b = base32Decode("GEZD gnbv=");
    expect(b.length).toBeGreaterThan(0);
  });
});

describe("totpCode (RFC 6238 vectors, 6-digit SHA1)", () => {
  it("matches the published codes at fixed times", () => {
    // 8-digit RFC values truncated to the standard 6-digit authenticator output.
    expect(totpCode(RFC_SECRET, 59_000)).toBe("287082");
    expect(totpCode(RFC_SECRET, 1_111_111_109_000)).toBe("081804");
    expect(totpCode(RFC_SECRET, 1_234_567_890_000)).toBe("005924");
  });
});

describe("verifyTotp", () => {
  it("accepts the current code", () => {
    const now = 1_111_111_109_000;
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, now), now)).toBe(true);
  });

  it("accepts a code one step of skew away", () => {
    const now = 1_111_111_109_000;
    const prev = totpCode(RFC_SECRET, now - 30_000);
    expect(verifyTotp(RFC_SECRET, prev, now, 1)).toBe(true);
  });

  it("rejects a code well outside the window", () => {
    const now = 1_111_111_109_000;
    const stale = totpCode(RFC_SECRET, now - 5 * 30_000);
    expect(verifyTotp(RFC_SECRET, stale, now, 1)).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(verifyTotp(RFC_SECRET, "12", Date.now())).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", Date.now())).toBe(false);
  });
});

describe("otpauthUri", () => {
  it("builds a scannable URI with the secret + issuer", () => {
    const uri = otpauthUri({ secretBase32: RFC_SECRET, accountName: "a@b.com" });
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain("issuer=Edway");
  });
});

describe("secrets & recovery codes", () => {
  it("generates a 32-char base32 secret", () => {
    expect(generateTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("generates unique, well-formed recovery codes", () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    codes.forEach((c) => expect(c).toMatch(/^[0-9a-f]{5}-[0-9a-f]{5}$/));
  });

  it("normalises recovery codes for comparison", () => {
    expect(normalizeRecoveryCode("AB12C-de34F")).toBe("ab12cde34f");
  });

  it("hashes recovery codes deterministically, invariant to dashes/case", () => {
    const h = hashRecoveryCode("AB12C-de34F");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    // Same code in any surface form hashes identically (enrol vs. sign-in).
    expect(hashRecoveryCode("ab12cde34f")).toBe(h);
    expect(hashRecoveryCode(" ab12c-de34f ")).toBe(h);
    // Different codes differ.
    expect(hashRecoveryCode("fffff-fffff")).not.toBe(h);
  });
});
