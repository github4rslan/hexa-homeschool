import { describe, it, expect } from "vitest";
import { resetSnapshot } from "@/lib/email/verification";

/**
 * The reset-link snapshot is what makes a password-reset link single-use and
 * replay-proof: it binds the link to the account's password_hash + token_version
 * at issue time. If either moves (a successful reset bumps token_version and the
 * hash), the snapshot must change so the old link no longer validates.
 */
describe("resetSnapshot", () => {
  const hash = "$2a$12$abcdefghijklmnopqrstuv";

  it("is stable for the same hash + token_version", () => {
    expect(resetSnapshot(hash, 0)).toBe(resetSnapshot(hash, 0));
  });

  it("changes when token_version is bumped (link consumed)", () => {
    expect(resetSnapshot(hash, 0)).not.toBe(resetSnapshot(hash, 1));
  });

  it("changes when the password hash changes", () => {
    expect(resetSnapshot(hash, 0)).not.toBe(resetSnapshot(`${hash}X`, 0));
  });

  it("returns a compact opaque hex string (no PII leakage)", () => {
    const snap = resetSnapshot(hash, 3);
    expect(snap).toMatch(/^[0-9a-f]{24}$/);
    expect(snap).not.toContain(hash);
  });
});
