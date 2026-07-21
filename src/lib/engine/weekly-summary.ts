/**
 * Qualitative weekly summary — deterministic, no AI. Turns a week of a child's
 * OWN learning data into warm, ACTIONABLE observations (not progress bars):
 * what was mastered, what's being found tricky, and the one thing worth
 * revisiting next. Pure functions, unit-tested in tests/.
 *
 * STRICT framing rules (brief + Children's Code):
 *  - Every figure is REAL — computed upstream from the child's record. This
 *    module only phrases it; it never invents or inflates.
 *  - Honest but always kind: a tricky topic is "finding X tricky", never
 *    "behind"/"failing". No comparison to other children (single-child input).
 *  - When there isn't enough evidence, say so warmly (`quiet`) rather than
 *    manufacturing a signal.
 */

export interface WeeklySummaryInput {
  childFirstName: string;
  lessonsCompleted: number;
  /** Titles of topics certified this week. */
  masteredTopics: string[];
  /** Titles of topics attempted this week but not yet secure (needs a look). */
  struggledTopics: string[];
  /** Per-concept standing tallies across the child's topics. */
  standings: { strong: number; growing: number; starting: number };
  /** The single topic worth revisiting next, or null. */
  recommendedFocus: string | null;
}

export interface WeeklySummaryContent {
  /** Warm headline, e.g. "A strong week for Ada". */
  headline: string;
  /** One-line qualitative observation of the week. */
  observation: string;
  /** Actionable focus line, or null when nothing needs revisiting. */
  focusLine: string | null;
  /** Per-concept standing read, or null when there's no evidence yet. */
  standingLine: string | null;
  /** True when there wasn't enough activity to say much. */
  quiet: boolean;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Join a list of titles into prose: "A", "A and B", "A, B and C". */
function proseList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Build the deterministic qualitative summary. Honest figures only; the tone is
 * encouraging whatever the week looked like.
 */
export function buildWeeklySummary(
  input: WeeklySummaryInput,
): WeeklySummaryContent {
  const name = input.childFirstName;
  const masteredCount = input.masteredTopics.length;
  const struggledCount = input.struggledTopics.length;
  const quiet = input.lessonsCompleted === 0 && masteredCount === 0;

  if (quiet) {
    return {
      headline: `A quiet week for ${name}`,
      observation: `${name} didn't complete a lesson this week — no pressure at all. Whenever it suits, this week's quests are ready to pick back up.`,
      focusLine: null,
      standingLine: null,
      quiet: true,
    };
  }

  const headline =
    masteredCount >= 3
      ? `A strong week for ${name}`
      : masteredCount > 0
        ? `Steady progress for ${name}`
        : `${name} kept at it this week`;

  // Observation — mastered + struggled, kindly framed.
  const parts: string[] = [];
  if (masteredCount > 0) {
    parts.push(
      `mastered ${masteredCount} ${plural(masteredCount, "topic", "topics")}`,
    );
  }
  if (struggledCount > 0) {
    parts.push(
      `is finding ${struggledCount} ${plural(struggledCount, "topic", "topics")} tricky`,
    );
  }
  const observation =
    parts.length > 0
      ? `This week ${name} ${proseList(parts)}.`
      : `${name} put in real effort across ${input.lessonsCompleted} ${plural(input.lessonsCompleted, "lesson", "lessons")} this week — steady, honest work.`;

  const focusLine = input.recommendedFocus
    ? `Recommended focus: another practice on ${input.recommendedFocus} will help it click.`
    : null;

  const { strong, growing, starting } = input.standings;
  const standingBits: string[] = [];
  if (strong > 0) standingBits.push(`${strong} strong`);
  if (growing > 0) standingBits.push(`${growing} growing`);
  if (starting > 0) standingBits.push(`${starting} just starting`);
  const standingLine =
    standingBits.length > 0
      ? `Where things stand: ${proseList(standingBits)}.`
      : null;

  return { headline, observation, focusLine, standingLine, quiet: false };
}

/** Input for the spoken parent recap — a plain shape (no DB types) so the
 *  narration builder stays pure + unit-testable. Maps 1:1 from `weekInReview`. */
export interface WeeklyRecapInput {
  childFirstName: string;
  weekLabel: string;
  lessonsCompleted: number;
  /** Titles of topics certified this week. */
  topicsCertified: string[];
  /** Consecutive-day streak, if any. */
  streak: number;
  /** Subject with the most lessons this week (display label), or null. */
  bestSubject: string | null;
  /** Distinct days active this week. */
  activeDays: number;
  quiet: boolean;
}

/**
 * Build the ~60-second spoken script for the parent weekly audio recap
 * (F6) — deterministic, no AI, warm register, honest figures only. The string
 * is fed verbatim to `/api/tts` (ElevenLabs, Cloudinary-cached by content
 * hash), so identical weeks reuse the same audio. Kept comfortably under the
 * TTS character cap. Never mentions other children (single-child input) and
 * never invents a figure it wasn't given.
 */
export function buildWeeklyRecapNarration(input: WeeklyRecapInput): string {
  const name = input.childFirstName;
  const certified = input.topicsCertified.length;

  if (input.quiet || (input.lessonsCompleted === 0 && certified === 0)) {
    return (
      `Here's ${name}'s week on Edway for ${input.weekLabel}. ` +
      `It was a quiet week — no lessons finished, and that's completely okay. ` +
      `Whenever it suits, this week's quests are ready to pick back up. ` +
      `We'll be right here.`
    );
  }

  const sentences: string[] = [];
  sentences.push(`Here's ${name}'s week on Edway for ${input.weekLabel}.`);

  const lessonWord = plural(input.lessonsCompleted, "lesson", "lessons");
  if (input.activeDays > 0) {
    const dayWord = plural(input.activeDays, "day", "days");
    sentences.push(
      `${name} completed ${input.lessonsCompleted} ${lessonWord} across ${input.activeDays} ${dayWord}.`,
    );
  } else {
    sentences.push(`${name} completed ${input.lessonsCompleted} ${lessonWord} this week.`);
  }

  if (certified > 0) {
    const topicWord = plural(certified, "topic", "topics");
    sentences.push(
      `That's ${certified} ${topicWord} mastered: ${proseList(input.topicsCertified)}.`,
    );
  }

  if (input.bestSubject) {
    sentences.push(`Most of the focus went into ${input.bestSubject}.`);
  }

  if (input.streak > 1) {
    sentences.push(`And ${name} is on a ${input.streak}-day streak — lovely consistency.`);
  }

  sentences.push(
    certified > 0
      ? `A genuinely strong week. See you next week.`
      : `Steady, honest effort. See you next week.`,
  );

  return sentences.join(" ");
}
