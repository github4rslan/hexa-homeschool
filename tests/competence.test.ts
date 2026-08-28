import { describe, expect, it } from "vitest";
import { resolveCertifiedAt, isFreshCertification } from "@/lib/engine/competence";

describe("resolveCertifiedAt", () => {
  const now = new Date("2026-08-27T12:00:00Z").getTime();

  it("returns null when the write is not a certification", () => {
    expect(resolveCertifiedAt("training", null, now)).toBeNull();
    expect(resolveCertifiedAt("locked", { state: "certified", certified_at: new Date() }, now)).toBeNull();
  });

  it("sets today's date on a fresh certification (no existing row)", () => {
    expect(resolveCertifiedAt("certified", null, now)).toEqual(new Date(now));
  });

  it("sets today's date on a fresh certification (existing row not yet certified)", () => {
    expect(
      resolveCertifiedAt("certified", { state: "training", certified_at: null }, now),
    ).toEqual(new Date(now));
  });

  it("B2: preserves the ORIGINAL certified_at when re-certifying an already-certified topic", () => {
    const originalDate = new Date("2026-07-01T09:00:00Z");
    const result = resolveCertifiedAt(
      "certified",
      { state: "certified", certified_at: originalDate },
      now,
    );
    expect(result).toEqual(originalDate);
    expect(result).not.toEqual(new Date(now));
  });

  it("falls back to now for a legacy already-certified row with no stored certified_at", () => {
    expect(
      resolveCertifiedAt("certified", { state: "certified", certified_at: null }, now),
    ).toEqual(new Date(now));
  });
});

describe("isFreshCertification", () => {
  it("is true when moving into certified from a non-certified (or missing) existing row", () => {
    expect(isFreshCertification("certified", null)).toBe(true);
    expect(isFreshCertification("certified", { state: "training" })).toBe(true);
  });

  it("is false when the topic was already certified (re-mastery)", () => {
    expect(isFreshCertification("certified", { state: "certified" })).toBe(false);
  });

  it("is false when the write isn't a certification at all", () => {
    expect(isFreshCertification("training", { state: "certified" })).toBe(false);
    expect(isFreshCertification("locked", null)).toBe(false);
  });
});
