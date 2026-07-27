import { describe, expect, it } from "vitest";
import {
  buildAchievementShelf,
  type SubjectBadgeSource,
} from "@/lib/engine/achievements";

const D = (iso: string) => new Date(iso);

const SUBJECTS: SubjectBadgeSource[] = [
  {
    subject: "mathematics",
    accent: "violet",
    nodes: [
      { topicTag: "m1", title: "Arithmetic", state: "certified", certifiedAt: D("2026-07-01") },
      { topicTag: "m2", title: "Fractions", state: "certified", certifiedAt: D("2026-07-20") },
      { topicTag: "m3", title: "Negatives", state: "training", certifiedAt: null },
    ],
  },
  {
    subject: "science",
    accent: "neon",
    nodes: [
      { topicTag: "s1", title: "Cells", state: "certified", certifiedAt: D("2026-07-10") },
      { topicTag: "s2", title: "Forces", state: "locked", certifiedAt: null },
    ],
  },
];

describe("buildAchievementShelf", () => {
  it("returns one badge per certified topic, most-recent first", () => {
    const shelf = buildAchievementShelf(SUBJECTS);
    expect(shelf.badges.map((b) => b.topicTag)).toEqual(["m2", "s1", "m1"]);
  });

  it("counts earned vs total across all subjects", () => {
    const shelf = buildAchievementShelf(SUBJECTS);
    expect(shelf.earnedCount).toBe(3);
    expect(shelf.totalCount).toBe(5);
  });

  it("carries the subject accent onto each badge", () => {
    const shelf = buildAchievementShelf(SUBJECTS);
    const cells = shelf.badges.find((b) => b.topicTag === "s1");
    expect(cells?.accent).toBe("neon");
    expect(cells?.subject).toBe("science");
  });

  it("places undated certified badges at the end", () => {
    const shelf = buildAchievementShelf([
      {
        subject: "english",
        accent: "cyan",
        nodes: [
          { topicTag: "e1", title: "Dated", state: "certified", certifiedAt: D("2026-07-05") },
          { topicTag: "e2", title: "Undated", state: "certified", certifiedAt: null },
        ],
      },
    ]);
    expect(shelf.badges.map((b) => b.topicTag)).toEqual(["e1", "e2"]);
  });

  it("is empty when nothing is certified", () => {
    const shelf = buildAchievementShelf([
      {
        subject: "mathematics",
        accent: "violet",
        nodes: [{ topicTag: "m1", title: "x", state: "locked", certifiedAt: null }],
      },
    ]);
    expect(shelf).toEqual({ badges: [], earnedCount: 0, totalCount: 1 });
  });
});
