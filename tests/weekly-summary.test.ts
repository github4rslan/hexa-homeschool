import { describe, expect, it } from "vitest";
import {
  buildWeeklySummary,
  buildWeeklyRecapNarration,
  buildReviewDueLine,
} from "@/lib/engine/weekly-summary";
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

describe("buildWeeklyRecapNarration — spoken ~60s parent recap (F6)", () => {
  const base = {
    childFirstName: "Ada",
    weekLabel: "2 – 8 June",
    lessonsCompleted: 4,
    topicsCertified: ["Fractions", "Cells"],
    streak: 3,
    bestSubject: "Maths",
    activeDays: 3,
    quiet: false,
  };

  it("narrates an active week with figures, mastered topics, streak and closer", () => {
    const script = buildWeeklyRecapNarration(base);
    expect(script).toContain("Ada");
    expect(script).toContain("2 – 8 June");
    expect(script).toContain("4 lessons across 3 days");
    expect(script).toContain("2 topics mastered");
    expect(script).toContain("Fractions and Cells");
    expect(script).toContain("Maths");
    expect(script).toContain("3-day streak");
    expect(script).toContain("See you next week.");
  });

  it("handles the quiet week warmly, with no invented figures", () => {
    const script = buildWeeklyRecapNarration({
      ...base,
      lessonsCompleted: 0,
      topicsCertified: [],
      streak: 0,
      activeDays: 0,
      quiet: true,
    });
    expect(script).toContain("quiet week");
    expect(script).not.toContain("mastered");
    expect(script).not.toContain("streak");
  });

  it("singularises one lesson / one topic and omits a 1-day streak line", () => {
    const script = buildWeeklyRecapNarration({
      ...base,
      lessonsCompleted: 1,
      topicsCertified: ["Fractions"],
      streak: 1,
      activeDays: 1,
    });
    expect(script).toContain("1 lesson across 1 day");
    expect(script).toContain("1 topic mastered");
    expect(script).not.toContain("streak");
  });

  it("stays comfortably under the TTS character cap", () => {
    const script = buildWeeklyRecapNarration({
      ...base,
      topicsCertified: ["Fractions", "Cells", "Algebra", "Photosynthesis", "Poetry"],
    });
    expect(script.length).toBeLessThan(1200);
  });
});

describe("buildReviewDueLine (F8) — parent digest review line", () => {
  it("returns null when nothing is due (no line rendered)", () => {
    expect(buildReviewDueLine("Ada", { overdue: 0, upcoming: 0 })).toBeNull();
  });

  it("names the count and singular/plural correctly", () => {
    const one = buildReviewDueLine("Ada", { overdue: 0, upcoming: 1 });
    expect(one).toContain("1 certified topic is due");
    expect(one).not.toContain("overdue");
    expect(one).toContain("Ada");

    const many = buildReviewDueLine("Ada", { overdue: 0, upcoming: 3 });
    expect(many).toContain("3 certified topics are due");
  });

  it("appends the overdue count when some are already overdue", () => {
    const line = buildReviewDueLine("Ben", { overdue: 2, upcoming: 1 });
    expect(line).toContain("3 certified topics are due");
    expect(line).toContain("(2 already overdue)");
  });

  it("uses no dash punctuation in the copy", () => {
    const line = buildReviewDueLine("Ada", { overdue: 1, upcoming: 4 })!;
    expect(line).not.toMatch(/[—–]| -- /);
  });
});
