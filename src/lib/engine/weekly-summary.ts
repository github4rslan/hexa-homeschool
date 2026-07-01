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
