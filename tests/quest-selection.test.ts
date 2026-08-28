import { describe, expect, it } from "vitest";
import {
  pickPlayableQuestTopic,
  pickScheduleQuestTopic,
  isQuestTopicDone,
  type QuestTopicLike,
} from "@/lib/engine/quest-selection";

const topics: QuestTopicLike[] = [
  { topic_tag: "sci_a", title: "Cells" },
  { topic_tag: "sci_b", title: "Energy" },
  { topic_tag: "sci_c", title: "Forces" },
];

describe("pickPlayableQuestTopic", () => {
  it("prefers the planned topic when it has a lesson", () => {
    const pick = pickPlayableQuestTopic({
      inBand: topics,
      certified: new Set(),
      playable: new Set(["sci_a", "sci_b", "sci_c"]),
      plannedTag: "sci_b",
    });
    expect(pick?.topic_tag).toBe("sci_b");
  });

  it("skips the planned topic when it has NO playable questions (the B2 wall)", () => {
    // Planned Science topic is unseeded → fall through to the next in-band
    // topic that actually has a lesson, never returning the dead-wall tag.
    const pick = pickPlayableQuestTopic({
      inBand: topics,
      certified: new Set(),
      playable: new Set(["sci_c"]),
      plannedTag: "sci_a",
    });
    expect(pick?.topic_tag).toBe("sci_c");
  });

  it("prefers the next uncertified playable topic", () => {
    const pick = pickPlayableQuestTopic({
      inBand: topics,
      certified: new Set(["sci_a"]),
      playable: new Set(["sci_a", "sci_b"]),
    });
    expect(pick?.topic_tag).toBe("sci_b");
  });

  it("falls back to any playable topic when all are certified", () => {
    const pick = pickPlayableQuestTopic({
      inBand: topics,
      certified: new Set(["sci_a", "sci_b", "sci_c"]),
      playable: new Set(["sci_b"]),
    });
    expect(pick?.topic_tag).toBe("sci_b");
  });

  it("returns null when nothing in-band has a lesson (subject is coming soon)", () => {
    const pick = pickPlayableQuestTopic({
      inBand: topics,
      certified: new Set(),
      playable: new Set(),
      plannedTag: "sci_a",
    });
    expect(pick).toBeNull();
  });
});

describe("pickScheduleQuestTopic", () => {
  it("never returns null when the band has topics (no empty plan day)", () => {
    const pick = pickScheduleQuestTopic({
      inBand: topics,
      certified: new Set(),
      playable: new Set(),
    });
    // No playable topic, but the schedule still assigns a topic (the hub then
    // guards the link) rather than leaving the day blank.
    expect(pick?.topic_tag).toBe("sci_a");
  });

  it("prefers a playable uncertified topic over an unseeded earlier one", () => {
    const pick = pickScheduleQuestTopic({
      inBand: topics,
      certified: new Set(),
      playable: new Set(["sci_b", "sci_c"]),
    });
    expect(pick?.topic_tag).toBe("sci_b");
  });
});

describe("isQuestTopicDone (B2)", () => {
  it("is done when completed today", () => {
    expect(isQuestTopicDone("eng_grammar", new Set(["eng_grammar"]), new Set())).toBe(true);
  });

  it("is done when certified on a prior day, even if NOT completed today", () => {
    // The exact B2 repro: certified yesterday, plan still lists it today, and
    // today's completion log doesn't include it — must still show as done.
    expect(
      isQuestTopicDone("eng_ks3_reading", new Set(), new Set(["eng_ks3_reading"])),
    ).toBe(true);
  });

  it("is NOT done when neither completed today nor certified", () => {
    expect(isQuestTopicDone("eng_grammar", new Set(), new Set())).toBe(false);
  });

  it("is done when both true (no double-counting issue)", () => {
    expect(
      isQuestTopicDone("eng_grammar", new Set(["eng_grammar"]), new Set(["eng_grammar"])),
    ).toBe(true);
  });
});
