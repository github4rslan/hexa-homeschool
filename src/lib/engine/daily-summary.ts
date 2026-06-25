/**
 * Daily progress summary — deterministic, no AI. Shapes the warm parent email
 * sent when a child finishes today's quests into honest, encouraging copy.
 *
 * STRICT framing rules (brief + Children's Code):
 *  - Every figure is REAL — computed upstream from the child's own data. This
 *    module only phrases it; it never invents, inflates or estimates.
 *  - NO comparison to other children, ever — the input carries one child only.
 *  - A hard day is framed supportively ("they stuck with it"), NEVER with
 *    "slow", "below", "behind" or any shaming language. Honest but kind.
 *
 * Pure functions, unit-tested in tests/.
 */

/** One topic the child worked on today and whether it reached mastery. */
export interface DailyTopicResult {
  title: string;
  /** True when the lesson hit the certification bar (mastery 100%). */
  mastered: boolean;
}

/** Per-subject competence so far ("3 of 10 topics secure in Maths"). */
export interface DailySubjectProgress {
  label: string;
  certified: number;
  total: number;
}

export interface DailySummaryInput {
  childFirstName: string;
  today: {
    lessonsCompleted: number;
    topics: DailyTopicResult[];
  };
  progress: {
    subjects: DailySubjectProgress[];
    /** Current learning streak in days (0 = none yet). */
    streak: number;
    /** Plain-English working stage, e.g. "primary level"; null when unknown. */
    stageLabel: string | null;
  };
}

export interface DailySummaryProgressLine {
  label: string;
  certified: number;
  total: number;
  text: string;
}

export interface DailySummaryContent {
  /** Subject line. */
  subject: string;
  /** Warm headline, e.g. "Ada did brilliantly today." */
  headline: string;
  /** One-line summary of how much was done today. */
  todayLine: string;
  /** Per-topic outcomes for today, kindly framed. */
  topicLines: { title: string; outcome: "Mastered" | "Needs another look" }[];
  /** Per-subject progress so far (only subjects with topics). */
  progressLines: DailySummaryProgressLine[];
  /** Streak encouragement, or null when there's no streak yet. */
  streakLine: string | null;
  /** Plain-English working stage, or null. */
  stageLine: string | null;
  /** Deterministic, always-kind read of today's effort. */
  effortNote: string;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Build the deterministic content for the daily summary email. Honest figures
 * only; the effort note is always encouraging, never a verdict.
 */
export function buildDailySummary(input: DailySummaryInput): DailySummaryContent {
  const name = input.childFirstName;
  const { lessonsCompleted, topics } = input.today;
  const masteredCount = topics.filter((t) => t.mastered).length;
  const total = topics.length;

  const headline =
    masteredCount > 0 && masteredCount === total && total > 0
      ? `${name} did brilliantly today.`
      : `${name} put the work in today.`;

  const todayLine =
    lessonsCompleted > 0
      ? `${name} finished ${lessonsCompleted} ${plural(lessonsCompleted, "lesson", "lessons")} today — every quest for today is done. 🎉`
      : `${name} wrapped up today's quests.`;

  const topicLines = topics.map((t) => ({
    title: t.title,
    outcome: (t.mastered ? "Mastered" : "Needs another look") as
      | "Mastered"
      | "Needs another look",
  }));

  const progressLines: DailySummaryProgressLine[] = input.progress.subjects
    .filter((s) => s.total > 0)
    .map((s) => ({
      label: s.label,
      certified: s.certified,
      total: s.total,
      text: `${s.certified} of ${s.total} ${plural(s.total, "topic", "topics")} secure in ${s.label}`,
    }));

  const streak = input.progress.streak;
  const streakLine =
    streak >= 2
      ? `${streak}-day streak — ${name} keeps showing up, and it shows.`
      : null;

  const stageLine = input.progress.stageLabel
    ? `Working at ${input.progress.stageLabel}.`
    : null;

  // Effort note — deterministic and ALWAYS kind. Never "slow"/"below"/shaming.
  let effortNote: string;
  if (total === 0) {
    effortNote = `${name} showed up and put the work in today — that habit is what matters most.`;
  } else if (masteredCount === total) {
    effortNote = `${name} mastered everything they took on today — a calm, focused effort to be proud of.`;
  } else if (masteredCount > 0) {
    effortNote = `${name} worked hard today and secured ${masteredCount} of ${total} ${plural(total, "topic", "topics")} — steady, real progress.`;
  } else {
    effortNote = `${name} stuck with every lesson today, even the tricky parts — that perseverance is exactly how learning sticks.`;
  }

  return {
    subject: `${name} did brilliantly today 🌟`,
    headline,
    todayLine,
    topicLines,
    progressLines,
    streakLine,
    stageLine,
    effortNote,
  };
}
