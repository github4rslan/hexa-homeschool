import { describe, expect, it } from "vitest";
import {
  bestWindowInsight,
  hintsInsight,
  moodInsight,
  buildInsights,
  gettingStartedInsight,
  MIN_BUCKET,
  MIN_GETTING_STARTED,
  type LessonSample,
  type MoodSample,
} from "@/lib/engine/insights";

function lessons(
  n: number,
  opts: Partial<LessonSample>,
): LessonSample[] {
  return Array.from({ length: n }, () => ({
    hour: opts.hour ?? 9,
    // Preserve an explicit null (ungraded); only default when the key is absent.
    mastery: "mastery" in opts ? (opts.mastery as number | null) : 80,
    hintsUsed: opts.hintsUsed ?? 0,
    certified: opts.certified ?? false,
  }));
}

describe("bestWindowInsight", () => {
  it("returns null below the per-bucket minimum", () => {
    const s = [...lessons(5, { hour: 9, mastery: 90 }), ...lessons(5, { hour: 14, mastery: 60 })];
    expect(bestWindowInsight(s)).toBeNull();
  });

  it("returns null when the gap is under 10 points", () => {
    const s = [
      ...lessons(MIN_BUCKET, { hour: 9, mastery: 82 }),
      ...lessons(MIN_BUCKET, { hour: 14, mastery: 80 }),
    ];
    expect(bestWindowInsight(s)).toBeNull();
  });

  it("flags mornings when clearly stronger", () => {
    const s = [
      ...lessons(MIN_BUCKET, { hour: 9, mastery: 88 }),
      ...lessons(MIN_BUCKET, { hour: 15, mastery: 64 }),
    ];
    const insight = bestWindowInsight(s);
    expect(insight?.text).toMatch(/mornings/);
    expect(insight?.text).toContain("88%");
  });

  it("flags afternoons when clearly stronger", () => {
    const s = [
      ...lessons(MIN_BUCKET, { hour: 9, mastery: 60 }),
      ...lessons(MIN_BUCKET, { hour: 15, mastery: 85 }),
    ];
    expect(bestWindowInsight(s)?.text).toMatch(/afternoons/);
  });

  it("ignores ungraded lessons in the buckets", () => {
    const s = [
      ...lessons(MIN_BUCKET - 1, { hour: 9, mastery: 90 }),
      ...lessons(5, { hour: 9, mastery: null }),
      ...lessons(MIN_BUCKET, { hour: 15, mastery: 60 }),
    ];
    // Morning has only MIN_BUCKET-1 GRADED → not enough.
    expect(bestWindowInsight(s)).toBeNull();
  });
});

describe("hintsInsight", () => {
  it("returns null below the minimum per group", () => {
    const s = [
      ...lessons(5, { hintsUsed: 1, certified: true }),
      ...lessons(MIN_BUCKET, { hintsUsed: 0, certified: true }),
    ];
    expect(hintsInsight(s)).toBeNull();
  });

  it("celebrates when hints don't lower certification", () => {
    const s = [
      ...lessons(MIN_BUCKET, { hintsUsed: 2, certified: true }),
      ...lessons(MIN_BUCKET, { hintsUsed: 0, certified: true }),
    ];
    expect(hintsInsight(s)?.key).toBe("hints-help");
  });

  it("stays silent when hints clearly track lower certification", () => {
    const s = [
      ...lessons(MIN_BUCKET, { hintsUsed: 2, certified: false }),
      ...lessons(MIN_BUCKET, { hintsUsed: 0, certified: true }),
    ];
    expect(hintsInsight(s)).toBeNull();
  });
});

describe("moodInsight", () => {
  function moods(n: number, mood: number, dayMastery: number | null): MoodSample[] {
    return Array.from({ length: n }, () => ({ mood, dayMastery }));
  }

  it("returns null below the minimum check-ins", () => {
    expect(moodInsight(moods(5, 5, 80))).toBeNull();
  });

  it("notes the pattern when high-mood days run clearly higher", () => {
    const m = [
      ...moods(MIN_BUCKET, 5, 88),
      ...moods(3, 1, 60),
    ];
    expect(moodInsight(m)?.key).toBe("mood-perf");
  });
});

describe("gettingStartedInsight", () => {
  it("is silent below the lessons floor with no certification", () => {
    expect(gettingStartedInsight(lessons(MIN_GETTING_STARTED - 1, { mastery: 80 }))).toBeNull();
  });

  it("surfaces a lessons-completed rhythm at the floor", () => {
    const insight = gettingStartedInsight(lessons(MIN_GETTING_STARTED, { mastery: 80 }));
    expect(insight?.key).toBe("getting-started");
    expect(insight?.text).toContain(`${MIN_GETTING_STARTED} lessons completed`);
  });

  it("prefers a mastery-milestone line as soon as one topic is certified", () => {
    const insight = gettingStartedInsight([
      ...lessons(1, { mastery: 100, certified: true }),
      ...lessons(2, { mastery: 70 }),
    ]);
    expect(insight?.text).toContain("1 mastery milestone reached");
  });

  it("never judges the child — descriptive rhythm only", () => {
    const insight = gettingStartedInsight(lessons(MIN_GETTING_STARTED, { mastery: 40 }));
    // A count of activity, not a verdict on ability.
    expect(insight?.text).not.toMatch(/behind|struggl|weak|poor|bad/i);
  });
});

describe("buildInsights", () => {
  it("marks learning=true with truly thin data (below the getting-started floor)", () => {
    const { learning, insights } = buildInsights(lessons(3, { mastery: 80 }), []);
    expect(learning).toBe(true);
    expect(insights).toEqual([]);
  });

  it("shows a getting-started line (learning=false) once the rhythm forms", () => {
    const { learning, insights } = buildInsights(
      lessons(MIN_GETTING_STARTED, { mastery: 80 }),
      [],
    );
    expect(learning).toBe(false);
    expect(insights).toHaveLength(1);
    expect(insights[0].key).toBe("getting-started");
  });

  it("replaces the getting-started line once statistical insights unlock", () => {
    const ls = [
      ...lessons(MIN_BUCKET, { hour: 9, mastery: 90, certified: true }),
      ...lessons(MIN_BUCKET, { hour: 15, mastery: 60, certified: true }),
    ];
    const { insights } = buildInsights(ls, []);
    expect(insights.some((i) => i.key === "getting-started")).toBe(false);
    expect(insights.some((i) => i.key === "best-window")).toBe(true);
  });

  it("collects multiple insights when data supports them", () => {
    const ls = [
      ...lessons(MIN_BUCKET, { hour: 9, mastery: 90, hintsUsed: 1, certified: true }),
      ...lessons(MIN_BUCKET, { hour: 15, mastery: 65, hintsUsed: 0, certified: true }),
    ];
    const { insights, learning } = buildInsights(ls, []);
    expect(learning).toBe(false);
    expect(insights.length).toBeGreaterThanOrEqual(1);
  });
});
