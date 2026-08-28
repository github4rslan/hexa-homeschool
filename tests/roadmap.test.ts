import { describe, it, expect } from "vitest";
import { buildRoadmapTopics } from "@/lib/engine/roadmap";

const topics = [
  { topic_tag: "t1", title: "Topic One" },
  { topic_tag: "t2", title: "Topic Two" },
  { topic_tag: "t3", title: "Topic Three" },
  { topic_tag: "t4", title: "Topic Four" },
];

describe("buildRoadmapTopics", () => {
  it("marks the first uncertified topic as current and the rest upcoming", () => {
    const out = buildRoadmapTopics(topics, new Set(["t1"]));
    expect(out.map((t) => t.state)).toEqual([
      "certified",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("only ever marks one topic current, even with gaps in the certified set", () => {
    // t2 certified but t1 not — t1 is still the first uncertified = current.
    const out = buildRoadmapTopics(topics, new Set(["t2"]));
    expect(out.map((t) => t.state)).toEqual([
      "current",
      "certified",
      "upcoming",
      "upcoming",
    ]);
    expect(out.filter((t) => t.state === "current")).toHaveLength(1);
  });

  it("marks the first topic current when nothing is certified", () => {
    const out = buildRoadmapTopics(topics, new Set());
    expect(out[0].state).toBe("current");
    expect(out.slice(1).every((t) => t.state === "upcoming")).toBe(true);
  });

  it("marks every topic certified for a fully-certified band (about to advance)", () => {
    const out = buildRoadmapTopics(topics, new Set(["t1", "t2", "t3", "t4"]));
    expect(out.every((t) => t.state === "certified")).toBe(true);
  });

  it("preserves order and carries title + tag through", () => {
    const out = buildRoadmapTopics(topics, new Set(["t1"]));
    expect(out.map((t) => t.topicTag)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(out[1]).toMatchObject({ title: "Topic Two", topicTag: "t2" });
  });

  it("returns an empty array for a band with no authored topics", () => {
    expect(buildRoadmapTopics([], new Set())).toEqual([]);
  });

  // F8 (2026-08-27): surface each topic's GCSE working-grade band, already
  // stored but previously discarded before it reached the parent-facing card.
  it("carries the working_grade_band through as workingGradeBand", () => {
    const withBands = [
      { topic_tag: "t1", title: "Topic One", working_grade_band: "Grade 1–3" },
      { topic_tag: "t2", title: "Topic Two", working_grade_band: "Grade 3–5" },
    ];
    const out = buildRoadmapTopics(withBands, new Set(["t1"]));
    expect(out[0]).toMatchObject({ topicTag: "t1", workingGradeBand: "Grade 1–3" });
    expect(out[1]).toMatchObject({ topicTag: "t2", workingGradeBand: "Grade 3–5" });
  });

  it("defaults workingGradeBand to null when a topic has none", () => {
    const out = buildRoadmapTopics(topics, new Set());
    expect(out.every((t) => t.workingGradeBand === null)).toBe(true);
  });
});
