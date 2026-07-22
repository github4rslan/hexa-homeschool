import { describe, expect, it } from "vitest";
import {
  pickPlayableQuestTopic,
  pickScheduleQuestTopic,
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
