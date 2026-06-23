import { describe, expect, it } from "vitest";
import { aiVisualsEnabled } from "@/lib/ai/visual-flags";

describe("AI visual kill switch", () => {
  it("is opt-in only", () => {
    expect(aiVisualsEnabled({ AI_VISUALS_ENABLED: "true" })).toBe(true);
    expect(aiVisualsEnabled({ AI_VISUALS_ENABLED: "false" })).toBe(false);
    expect(aiVisualsEnabled({ AI_VISUALS_ENABLED: undefined })).toBe(false);
  });
});
