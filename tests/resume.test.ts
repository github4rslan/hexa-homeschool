import { describe, it, expect } from "vitest";
import {
  buildResumeCards,
  type InProgressRow,
  type TopicMeta,
} from "@/lib/child/resume";

const meta = new Map<string, TopicMeta>([
  ["eng_ks2_reading", { title: "Reading & Spelling", subject: "english" }],
  ["maths_number", { title: "Number & Place Value", subject: "mathematics" }],
  ["sci_ks2_materials", { title: "Materials", subject: "science" }],
]);

function row(over: Partial<InProgressRow>): InProgressRow {
  return {
    topic_tag: "eng_ks2_reading",
    step: 2,
    total: 6,
    updated_at: new Date("2026-08-07T10:00:00Z"),
    ...over,
  };
}

describe("buildResumeCards", () => {
  it("builds a display card for a genuinely mid-lesson row", () => {
    const cards = buildResumeCards([row({})], meta);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      topicTag: "eng_ks2_reading",
      title: "Reading & Spelling",
      subject: "english",
      current: 3, // step is 0-based; card is 1-based
      total: 6,
      pct: 33, // round(2/6 * 100)
    });
  });

  it("drops rows at the very start, at/after the end, or with no total", () => {
    expect(buildResumeCards([row({ step: 0 })], meta)).toHaveLength(0);
    expect(buildResumeCards([row({ step: 6, total: 6 })], meta)).toHaveLength(0);
    expect(buildResumeCards([row({ step: 7, total: 6 })], meta)).toHaveLength(0);
    expect(buildResumeCards([row({ total: 0 })], meta)).toHaveLength(0);
  });

  it("drops rows whose topic has no metadata (deleted/renamed topic)", () => {
    expect(
      buildResumeCards([row({ topic_tag: "ghost_topic" })], meta),
    ).toHaveLength(0);
  });

  it("orders most-recently-touched first", () => {
    const cards = buildResumeCards(
      [
        row({
          topic_tag: "eng_ks2_reading",
          updated_at: new Date("2026-08-07T09:00:00Z"),
        }),
        row({
          topic_tag: "maths_number",
          updated_at: new Date("2026-08-07T12:00:00Z"),
        }),
      ],
      meta,
    );
    expect(cards.map((c) => c.topicTag)).toEqual([
      "maths_number",
      "eng_ks2_reading",
    ]);
  });

  it("ignores non-finite step/total defensively", () => {
    expect(buildResumeCards([row({ step: NaN })], meta)).toHaveLength(0);
  });
});
