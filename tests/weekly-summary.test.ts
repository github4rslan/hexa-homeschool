import { describe, expect, it } from "vitest";
import { buildWeeklySummary } from "@/lib/engine/weekly-summary";
import { classifyTopicStanding } from "@/lib/engine/insights";

describe("classifyTopicStanding — warm, honest bands", () => {
  it("certified is always strong", () => {
    expect(
      classifyTopicStanding({ state: "certified", weekBestMastery: 0 }),
    ).toBe("strong");
  });

  it("a handoff-paused topic is 'starting' (finding it tricky)", () => {
    expect(
      classifyTopicStanding({ state: "training", paused: true, weekBestMastery: 90 }),
    ).toBe("starting");
  });

  it("training with decent recent mastery is 'growing'", () => {
    expect(
      classifyTopicStanding({ state: "training", weekBestMastery: 70 }),
    ).toBe("growing");
    expect(classifyTopicStanding({ state: "training" })).toBe("growing");
  });

  it("training with low recent mastery is 'starting'", () => {
    expect(
      classifyTopicStanding({ state: "training", weekBestMastery: 30 }),
    ).toBe("starting");
  });

  it("an untouched locked topic yields nothing to say", () => {
    expect(classifyTopicStanding({ state: "locked" })).toBeNull();
    expect(
      classifyTopicStanding({ state: "locked", weekBestMastery: null }),
    ).toBeNull();
  });

  it("a locked topic that was attempted counts as starting", () => {
    expect(
      classifyTopicStanding({ state: "locked", weekBestMastery: 40 }),
    ).toBe("starting");
  });
});

describe("buildWeeklySummary — qualitative observations, not bars", () => {
  it("summarises a strong week with mastered + struggled + focus", () => {
    const c = buildWeeklySummary({
      childFirstName: "Ada",
      lessonsCompleted: 6,
      masteredTopics: ["Fractions", "Ratio", "Decimals", "Percentages"],
      struggledTopics: ["Word problems with fractions"],
      standings: { strong: 4, growing: 2, starting: 1 },
      recommendedFocus: "Word problems with fractions",
    });
    expect(c.headline).toBe("A strong week for Ada");
    expect(c.observation).toContain("mastered 4 topics");
    expect(c.observation).toContain("finding 1 topic tricky");
    expect(c.focusLine).toContain("Word problems with fractions");
    expect(c.standingLine).toContain("4 strong");
    expect(c.standingLine).toContain("just starting");
    expect(c.quiet).toBe(false);
    // Honest but never a deficit label.
    expect(`${c.observation} ${c.focusLine}`).not.toMatch(/behind|failing|slow/i);
  });

  it("has no focus line when nothing needs revisiting", () => {
    const c = buildWeeklySummary({
      childFirstName: "Leo",
      lessonsCompleted: 3,
      masteredTopics: ["Nouns", "Verbs"],
      struggledTopics: [],
      standings: { strong: 2, growing: 0, starting: 0 },
      recommendedFocus: null,
    });
    expect(c.headline).toBe("Steady progress for Leo");
    expect(c.focusLine).toBeNull();
    expect(c.observation).toContain("mastered 2 topics");
  });

  it("frames a quiet week warmly, with no invented signal", () => {
    const c = buildWeeklySummary({
      childFirstName: "Mia",
      lessonsCompleted: 0,
      masteredTopics: [],
      struggledTopics: [],
      standings: { strong: 0, growing: 0, starting: 0 },
      recommendedFocus: null,
    });
    expect(c.quiet).toBe(true);
    expect(c.headline).toContain("quiet week");
    expect(c.standingLine).toBeNull();
    expect(c.focusLine).toBeNull();
  });

  it("celebrates effort when lessons ran but nothing certified yet", () => {
    const c = buildWeeklySummary({
      childFirstName: "Sam",
      lessonsCompleted: 4,
      masteredTopics: [],
      struggledTopics: ["Long division"],
      standings: { strong: 0, growing: 1, starting: 1 },
      recommendedFocus: "Long division",
    });
    expect(c.quiet).toBe(false);
    expect(c.observation).toContain("finding 1 topic tricky");
    expect(c.headline).toContain("Sam");
  });
});
