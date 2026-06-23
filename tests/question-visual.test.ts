import { describe, expect, it } from "vitest";
import { visualFromApiPayload } from "@/lib/child/question-visual";

describe("question visual payload parsing", () => {
  it("accepts a checked visual payload", () => {
    expect(
      visualFromApiPayload({
        visual: { url: "https://example.com/v.png", alt: "A diagram" },
      }),
    ).toEqual({ url: "https://example.com/v.png", alt: "A diagram" });
  });

  it("treats null, malformed, or no-visual payloads as no visual", () => {
    expect(visualFromApiPayload({ visual: null })).toBeNull();
    expect(visualFromApiPayload({ visual: { alt: "missing url" } })).toBeNull();
    expect(visualFromApiPayload(null)).toBeNull();
  });
});
