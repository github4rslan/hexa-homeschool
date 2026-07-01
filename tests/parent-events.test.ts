import { describe, expect, it } from "vitest";
import {
  attemptsPhrase,
  buildParentEventCopy,
  type ParentEventType,
} from "@/lib/engine/parent-events";

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
