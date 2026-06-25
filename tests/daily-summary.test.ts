import { describe, expect, it } from "vitest";
import { buildDailySummary } from "@/lib/engine/daily-summary";
import { dailySummaryTemplate } from "@/lib/email/templates";

const base = {
  childFirstName: "Ada",
  today: {
    lessonsCompleted: 2,
    topics: [
      { title: "Fractions", mastered: true },
      { title: "Ratio & Proportion", mastered: false },
    ],
  },
  progress: {
    subjects: [
      { label: "Maths", certified: 3, total: 10 },
      { label: "English", certified: 0, total: 8 },
      { label: "Science", certified: 0, total: 0 },
    ],
    streak: 4,
    stageLabel: "primary level",
  },
};

describe("buildDailySummary — deterministic content", () => {
  it("reports real per-topic outcomes with kind framing", () => {
    const c = buildDailySummary(base);
    expect(c.topicLines).toEqual([
      { title: "Fractions", outcome: "Mastered" },
      { title: "Ratio & Proportion", outcome: "Needs another look" },
    ]);
    expect(c.todayLine).toContain("2 lessons");
  });

  it("shows per-subject competence, dropping subjects with no topics", () => {
    const c = buildDailySummary(base);
    expect(c.progressLines.map((p) => p.text)).toEqual([
      "3 of 10 topics secure in Maths",
      "0 of 8 topics secure in English",
    ]);
  });

  it("celebrates a streak and surfaces the working stage", () => {
    const c = buildDailySummary(base);
    expect(c.streakLine).toContain("4-day streak");
    expect(c.stageLine).toBe("Working at primary level.");
  });

  it("hides the streak line below 2 days and the stage line when unknown", () => {
    const c = buildDailySummary({
      ...base,
      progress: { ...base.progress, streak: 1, stageLabel: null },
    });
    expect(c.streakLine).toBeNull();
    expect(c.stageLine).toBeNull();
  });

  it("frames a fully-mastered day proudly", () => {
    const c = buildDailySummary({
      ...base,
      today: {
        lessonsCompleted: 1,
        topics: [{ title: "Fractions", mastered: true }],
      },
    });
    expect(c.effortNote).toContain("mastered everything");
    expect(c.headline).toBe("Ada did brilliantly today.");
  });

  it("frames a hard day supportively — never shaming", () => {
    const c = buildDailySummary({
      ...base,
      today: {
        lessonsCompleted: 2,
        topics: [
          { title: "Fractions", mastered: false },
          { title: "Ratio", mastered: false },
        ],
      },
    });
    expect(c.effortNote).toContain("stuck with");
    expect(c.effortNote).not.toMatch(/slow|below|behind|fail/i);
  });

  it("never compares to other children", () => {
    const c = buildDailySummary(base);
    const all = JSON.stringify(c).toLowerCase();
    expect(all).not.toMatch(/other (children|kids|pupils|students)|average|percentile|rank/);
  });
});

describe("dailySummaryTemplate — layout", () => {
  it("builds HTML + a plain-text fallback with the CTA and opt-out", () => {
    const c = buildDailySummary(base);
    const t = dailySummaryTemplate({
      parentName: "Sam Jones",
      content: c,
      childDetailUrl: "https://hexa.test/dashboard/children/abc",
      settingsUrl: "https://hexa.test/settings",
    });
    expect(t.subject).toContain("Ada");
    // HTML
    expect(t.html).toContain("<!DOCTYPE html>");
    expect(t.html).toContain("Sam"); // first name only
    expect(t.html).not.toContain("Jones");
    expect(t.html).toContain("https://hexa.test/dashboard/children/abc");
    expect(t.html).toContain("https://hexa.test/settings");
    expect(t.html).toContain("Fractions");
    // Plain-text fallback
    expect(t.text).toContain("Fractions: Mastered");
    expect(t.text).toContain("3 of 10 topics secure in Maths");
    expect(t.text).toContain("https://hexa.test/dashboard/children/abc");
  });
});
