import { describe, expect, it } from "vitest";
import {
  clearTtsQuotaExhausted,
  isQuotaExceeded,
  markTtsQuotaExhausted,
  ttsQuotaExhausted,
} from "@/lib/ai/tts-quota";

describe("isQuotaExceeded", () => {
  it("matches a 401 quota_exceeded ElevenLabs response", () => {
    expect(
      isQuotaExceeded(401, '{"detail":{"status":"quota_exceeded","message":"..."}}'),
    ).toBe(true);
  });

  it("does not match an unrelated 401 (e.g. bad api key)", () => {
    expect(isQuotaExceeded(401, '{"detail":{"status":"invalid_api_key"}}')).toBe(
      false,
    );
  });

  it("does not match a non-401 status even if the text mentions quota", () => {
    expect(isQuotaExceeded(500, "quota_exceeded")).toBe(false);
  });
});

describe("tts quota cooldown", () => {
  it("starts closed, opens on markTtsQuotaExhausted, and expires after the cooldown", () => {
    clearTtsQuotaExhausted();
    const t0 = Date.parse("2026-06-12T10:00:00Z");
    expect(ttsQuotaExhausted(t0)).toBe(false);

    markTtsQuotaExhausted(t0);
    expect(ttsQuotaExhausted(t0)).toBe(true);
    expect(ttsQuotaExhausted(t0 + 5 * 60 * 1000)).toBe(true); // 5 min later, still cooling down
    expect(ttsQuotaExhausted(t0 + 25 * 60 * 1000)).toBe(false); // 25 min later, expired
  });

  it("clearTtsQuotaExhausted immediately reopens the gate", () => {
    const t0 = Date.parse("2026-06-12T10:00:00Z");
    markTtsQuotaExhausted(t0);
    expect(ttsQuotaExhausted(t0)).toBe(true);
    clearTtsQuotaExhausted();
    expect(ttsQuotaExhausted(t0)).toBe(false);
  });
});
