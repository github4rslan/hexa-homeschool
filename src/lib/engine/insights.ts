/**
 * Learning insights — deterministic, no AI. Computes plain-English patterns
 * from a child's completed lessons and check-ins for the parent's child-detail
 * page. Pure functions, unit-tested in tests/.
 *
 * STRICT framing rules (enforced here and in the UI):
 *  - Insights describe PATTERNS, never judge the child.
 *  - NO comparison between siblings, ever — this module never takes more than
 *    one child's data and exposes no ranking.
 *  - A line is only emitted when statistically meaningful (see thresholds);
 *    otherwise the caller shows a "still learning their rhythm" message.
 */

/** One completed-lesson sample. `mastery` is 0–100 or null when unknown. */
export interface LessonSample {
  /** Local hour 0–23 the lesson ENDED at. */
  hour: number;
  mastery: number | null;
  hintsUsed: number;
  certified: boolean;
}

/** One mood check-in sample. `mood` is 1–5. */
export interface MoodSample {
  mood: number;
  /** Average mastery of lessons completed the same day, or null. */
  dayMastery: number | null;
}

export interface Insight {
  /** Stable key for rendering. */
  key: string;
  text: string;
}

/** Minimum samples per bucket before a comparison is considered meaningful. */
export const MIN_BUCKET = 10;

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * "Best learning window": compare average mastery before noon vs from noon on.
 * Emitted only when BOTH buckets have ≥ MIN_BUCKET graded lessons and the gap
 * is at least 10 percentage points.
 */
export function bestWindowInsight(samples: LessonSample[]): Insight | null {
  const graded = samples.filter((s) => s.mastery !== null);
  const morning = graded.filter((s) => s.hour < 12).map((s) => s.mastery as number);
  const afternoon = graded.filter((s) => s.hour >= 12).map((s) => s.mastery as number);
  if (morning.length < MIN_BUCKET || afternoon.length < MIN_BUCKET) return null;

  const m = Math.round(avg(morning));
  const a = Math.round(avg(afternoon));
  if (Math.abs(m - a) < 10) return null;

  const morningsBetter = m > a;
  return {
    key: "best-window",
    text: morningsBetter
      ? `Best learning window: mornings — mastery averages ${m}% before noon vs ${a}% after.`
      : `Best learning window: afternoons — mastery averages ${a}% from noon vs ${m}% before.`,
  };
}

/**
 * "Hints help": topics where hints were used get certified just as often as
 * those without. Emitted only when both groups have ≥ MIN_BUCKET lessons and
 * the with-hints certification rate is within (or above) 10 points of without.
 * Framed positively — never as a deficit.
 */
export function hintsInsight(samples: LessonSample[]): Insight | null {
  const withHints = samples.filter((s) => s.hintsUsed > 0);
  const without = samples.filter((s) => s.hintsUsed === 0);
  if (withHints.length < MIN_BUCKET || without.length < MIN_BUCKET) return null;

  const rate = (g: LessonSample[]) =>
    g.filter((s) => s.certified).length / g.length;
  const withRate = rate(withHints);
  const withoutRate = rate(without);
  // Only celebrate when hints didn't hold the child back.
  if (withRate < withoutRate - 0.1) return null;

  return {
    key: "hints-help",
    text: "Hints help: topics where hints were used got certified just as often — asking for a nudge is working well.",
  };
}

/**
 * Gentle mood→performance note: higher-mood days line up with stronger mastery.
 * Emitted only with ≥ MIN_BUCKET check-ins that have a same-day mastery figure,
 * and a clear positive gap between high-mood and low-mood days.
 */
export function moodInsight(moods: MoodSample[]): Insight | null {
  const usable = moods.filter((m) => m.dayMastery !== null);
  if (usable.length < MIN_BUCKET) return null;

  const high = usable.filter((m) => m.mood >= 4).map((m) => m.dayMastery as number);
  const low = usable.filter((m) => m.mood <= 2).map((m) => m.dayMastery as number);
  if (high.length < 3 || low.length < 3) return null;

  const h = Math.round(avg(high));
  const l = Math.round(avg(low));
  if (h - l < 10) return null;

  return {
    key: "mood-perf",
    text: `On days they feel good, mastery runs higher (${h}% vs ${l}%) — a calm start helps.`,
  };
}

/**
 * A warm, honest per-concept read for the parent (Wave 7, Phase 5 — folds in
 * "where my child struggles"). Deterministic; three kind bands, never a
 * "behind"/deficit label, never a comparison to other children:
 *  - "strong"   — certified (secure).
 *  - "growing"  — in training and progressing.
 *  - "starting" — just begun, finding it tricky, or resting for a tutor handoff.
 */
export type TopicStanding = "strong" | "growing" | "starting";

/** Minimal per-topic signal for a standing read, all from the child's record. */
export interface TopicSignal {
  state: "locked" | "training" | "certified";
  /** Topic set aside for a five-attempt tutor handoff. */
  paused?: boolean;
  /** Best mastery seen for this topic in the window (0–100), or null if none. */
  weekBestMastery?: number | null;
}

/**
 * Classify one topic into a warm standing, or null when there's nothing honest
 * to say yet (locked with no attempt). A certified topic is always "strong"; a
 * handoff-paused topic is "starting" (finding it tricky — help is lined up); an
 * in-training topic is "growing" unless a low recent mastery says it's still
 * "starting".
 */
export function classifyTopicStanding(s: TopicSignal): TopicStanding | null {
  if (s.state === "certified") return "strong";
  if (s.paused) return "starting";
  if (s.state === "training") {
    if (s.weekBestMastery != null && s.weekBestMastery < 50) return "starting";
    return "growing";
  }
  // locked / untouched: attempted (has a mastery reading) counts as starting.
  if (s.weekBestMastery != null) return "starting";
  return null;
}

/**
 * Lessons completed before a "getting started" line is worth showing — enough
 * that a genuine rhythm exists, but well below MIN_BUCKET so an engaged family
 * isn't stuck on the empty "still learning" message for weeks.
 */
export const MIN_GETTING_STARTED = 5;

/**
 * A single low-floor "getting started" line for the gap BEFORE the richer,
 * statistically-backed insights unlock. Deterministic and strictly DESCRIPTIVE
 * — a count of real activity, never a judgement of the child and never a
 * premature best-window claim on a thin sample (Children's Code). Prefers the
 * more encouraging TRUE statement: a mastery milestone if any topic is
 * certified, otherwise the lessons-completed rhythm. Null when there's too
 * little to say honestly.
 */
export function gettingStartedInsight(samples: LessonSample[]): Insight | null {
  const certified = samples.filter((s) => s.certified).length;
  if (certified >= 1) {
    return {
      key: "getting-started",
      text: `${certified} mastery ${
        certified === 1 ? "milestone" : "milestones"
      } reached so far — that's secure knowledge banked. As more lessons build up, patterns like the best time of day will appear here too.`,
    };
  }
  const graded = samples.filter((s) => s.mastery !== null).length;
  if (graded >= MIN_GETTING_STARTED) {
    return {
      key: "getting-started",
      text: `${graded} lessons completed so far — a steady rhythm is forming. Patterns like the best time of day will appear here as more come in.`,
    };
  }
  return null;
}

/**
 * Build the full insight set. Returns `{ insights, learning }` — when `learning`
 * is true there isn't enough data yet and the caller shows the "still learning
 * their rhythm" message instead of an empty panel.
 */
export function buildInsights(
  lessons: LessonSample[],
  moods: MoodSample[],
): { insights: Insight[]; learning: boolean } {
  const statistical = [
    bestWindowInsight(lessons),
    hintsInsight(lessons),
    moodInsight(moods),
  ].filter((i): i is Insight => i !== null);

  // Once the statistically-backed lines exist, show those. Before then, a single
  // low-floor "getting started" line keeps the panel honest AND alive for an
  // engaged family, instead of a blank "still learning" wall for weeks.
  const insights =
    statistical.length > 0
      ? statistical
      : [gettingStartedInsight(lessons)].filter((i): i is Insight => i !== null);

  // Only truly-empty (no honest line at all) shows the "still learning" message.
  const learning = insights.length === 0;
  return { insights, learning };
}
