import { describe, expect, it } from "vitest";
import {
  reexplainFromWorkedExample,
  reexplainFromSummary,
} from "@/lib/child/reexplain";
import type { WorkedExample } from "@/lib/child/worked-examples";

describe("reexplainFromWorkedExample (F4)", () => {
  const ex: WorkedExample = {
    title: "Rounding to the nearest 100",
    scenario: "We want to round 486 to the nearest hundred.",
    steps: [
      { line: "Find the multiples of 100 either side: 400 and 500." },
      { line: "486 is closer to 500 than to 400." },
      { line: "So 486 rounds to 500." },
    ],
  };

  it("frames the title + scenario as the prompt", () => {
    const ctx = reexplainFromWorkedExample(ex);
    expect(ctx.prompt).toBe(
      "Rounding to the nearest 100 — We want to round 486 to the nearest hundred.",
    );
  });

  it("uses the concluding step as the canonical answer to ground the agent", () => {
    const ctx = reexplainFromWorkedExample(ex);
    expect(ctx.correctAnswer).toBe("So 486 rounds to 500.");
  });

  it("builds a human fallback that re-presents every step", () => {
    const ctx = reexplainFromWorkedExample(ex);
    expect(ctx.fallback).toContain("400 and 500");
    expect(ctx.fallback).toContain("rounds to 500");
    expect(ctx.fallback.startsWith("Here's the same idea")).toBe(true);
  });

  it("falls back to the title when there are no steps", () => {
    const ctx = reexplainFromWorkedExample({ title: "A topic", steps: [] });
    expect(ctx.correctAnswer).toBe("A topic");
    expect(ctx.fallback).toBe("A topic");
    expect(ctx.prompt).toBe("A topic");
  });
});

describe("reexplainFromSummary (F4)", () => {
  it("frames title + summary as the prompt and grounds on the summary", () => {
    const ctx = reexplainFromSummary(
      "Place value",
      "Each digit's value depends on its column.",
      ["Ones, tens, hundreds.", "Move left, the value grows tenfold."],
    );
    expect(ctx.prompt).toBe(
      "Place value — Each digit's value depends on its column.",
    );
    expect(ctx.correctAnswer).toBe("Each digit's value depends on its column.");
    expect(ctx.fallback).toContain("Ones, tens, hundreds.");
    expect(ctx.fallback).toContain("grows tenfold");
  });

  it("degrades to the summary when there are no points", () => {
    const ctx = reexplainFromSummary("T", "Just the summary.", []);
    expect(ctx.fallback).toBe("Just the summary.");
  });
});
