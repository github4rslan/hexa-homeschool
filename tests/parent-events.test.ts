import { describe, expect, it } from "vitest";
import {
  attemptsPhrase,
  buildParentEventCopy,
  masteryHighlightLine,
  type ParentEventType,
} from "@/lib/engine/parent-events";

describe("masteryHighlightLine — same-day dashboard highlight (F3)", () => {
  it("returns empty string for no masteries", () => {
    expect(masteryHighlightLine([])).toBe("");
  });

  it("reads specifically for a single topic with attempt phrasing", () => {
    expect(
      masteryHighlightLine([
        { childFirstName: "Ada", topicTitle: "Fractions", attempts: 1 },
      ]),
    ).toBe("Ada mastered Fractions today — first try 🎉");
  });

  it("uses multi-attempt phrasing when it took more than one go", () => {
    expect(
      masteryHighlightLine([
        { childFirstName: "Ben", topicTitle: "Forces & Energy", attempts: 3 },
      ]),
    ).toBe("Ben mastered Forces & Energy today — 3 attempts 🎉");
  });

  it("rolls several topics up, grouped by child", () => {
    const line = masteryHighlightLine([
      { childFirstName: "Ada", topicTitle: "Fractions", attempts: 1 },
      { childFirstName: "Ada", topicTitle: "Cells", attempts: 2 },
      { childFirstName: "Ben", topicTitle: "Forces", attempts: 1 },
    ]);
    expect(line).toBe("3 topics mastered today 🎉 — Ada: Fractions, Cells; Ben: Forces");
  });

  it("falls back to a safe topic word when a title is missing", () => {
    expect(
      masteryHighlightLine([{ childFirstName: "Ada", topicTitle: "", attempts: 1 }]),
    ).toBe("Ada mastered a new topic today — first try 🎉");
  });
});

describe("attemptsPhrase — honest, kind attempt wording", () => {
  it("treats 0, 1, null and undefined as 'first try'", () => {
    expect(attemptsPhrase(1)).toBe("first try");
    expect(attemptsPhrase(0)).toBe("first try");
    expect(attemptsPhrase(null)).toBe("first try");
    expect(attemptsPhrase(undefined)).toBe("first try");
  });

  it("pluralises multi-attempt counts", () => {
    expect(attemptsPhrase(2)).toBe("2 attempts");
    expect(attemptsPhrase(5)).toBe("5 attempts");
  });
});

describe("buildParentEventCopy — mastery", () => {
  const copy = buildParentEventCopy({
    type: "mastery",
    childFirstName: "Ada",
    topicTitle: "Fractions",
    attempts: 3,
  });

  it("is warm, specific, and names topic + attempts", () => {
    expect(copy.feedTitle).toBe("Mastered Fractions");
    expect(copy.feedDetail).toContain("Ada");
    expect(copy.feedDetail).toContain("3 attempts");
    expect(copy.emailSubject).toContain("Ada");
    expect(copy.emailSubject).toContain("Fractions");
    expect(copy.emailBody).toContain("3 attempts");
    expect(copy.smsBody).toContain("Ada");
    expect(copy.smsBody).toContain("Fractions");
  });

  it("says 'first try' when certified in one go", () => {
    const first = buildParentEventCopy({
      type: "mastery",
      childFirstName: "Ada",
      topicTitle: "Fractions",
      attempts: 1,
    });
    expect(first.feedDetail).toContain("first try");
    expect(first.emailBody).toContain("first try");
  });
});

describe("buildParentEventCopy — handoff", () => {
  const copy = buildParentEventCopy({
    type: "handoff",
    childFirstName: "Sam",
    topicTitle: "Decimals",
  });

  it("frames struggle as support, never failure", () => {
    const all = `${copy.feedTitle} ${copy.feedDetail} ${copy.emailBody} ${copy.smsBody}`;
    expect(all).not.toMatch(/fail|behind|wrong/i);
    expect(copy.emailBody).toContain("tricky");
    expect(copy.emailBody).toContain("paused");
    expect(copy.smsBody).toContain("Decimals");
  });
});

describe("buildParentEventCopy — inactivity", () => {
  const copy = buildParentEventCopy({
    type: "inactivity",
    childFirstName: "Leo",
  });

  it("is a gentle PARENT reminder, no pressure", () => {
    expect(copy.emailHeadline).toContain("Leo");
    expect(copy.emailHeadline.toLowerCase()).toContain("hasn't logged in");
    expect(copy.emailBody).toContain("gentle");
    expect(copy.smsBody).toContain("Leo");
  });
});

describe("buildParentEventCopy — legacy safety", () => {
  it("falls back to a safe topic word when the title is missing", () => {
    for (const type of ["mastery", "handoff"] as ParentEventType[]) {
      const copy = buildParentEventCopy({ type, childFirstName: "Mia", topicTitle: "" });
      expect(copy.feedTitle).toContain("a new topic");
      expect(copy.feedTitle).not.toContain("undefined");
    }
  });
});
