import { describe, it, expect } from "vitest";
import {
  interpretSafetyResponse,
  guardBlocksAdvance,
} from "@/lib/safety/free-text-gate";

describe("interpretSafetyResponse — fail-safe distress gate", () => {
  it("freezes on an explicit frozen verdict", () => {
    expect(interpretSafetyResponse(true, { frozen: true, message: "pause" })).toBe(
      "frozen",
    );
  });

  it("clears on an ok response with no distress", () => {
    expect(interpretSafetyResponse(true, { ok: true })).toBe("clear");
    expect(interpretSafetyResponse(true, { frozen: false })).toBe("clear");
  });

  it("is UNAVAILABLE (not clear) on a non-ok HTTP status", () => {
    // A 500 / 401 / 413 must never be treated as 'safe to advance'.
    expect(interpretSafetyResponse(false, { error: "boom" })).toBe("unavailable");
    expect(interpretSafetyResponse(false, null)).toBe("unavailable");
  });

  it("is UNAVAILABLE on a malformed / non-object body", () => {
    expect(interpretSafetyResponse(true, null)).toBe("unavailable");
    expect(interpretSafetyResponse(true, "nope")).toBe("unavailable");
    expect(interpretSafetyResponse(true, { frozen: "yes" })).toBe("unavailable");
  });

  it("guardBlocksAdvance blocks everything except a clean clear", () => {
    expect(guardBlocksAdvance("clear")).toBe(false);
    expect(guardBlocksAdvance("frozen")).toBe(true);
    expect(guardBlocksAdvance("unavailable")).toBe(true);
  });
});
