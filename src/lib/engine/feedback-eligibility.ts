/**
 * Parent-feedback prompt eligibility + input validation — PURE, deterministic,
 * unit-tested (tests/feedback-eligibility.test.ts). No DB, no network, no AI.
 *
 * The widget is a voluntary parent signal ("are parents happy?"). It must be
 * shown ONLY after a positive/meaningful moment, at most once, then cooled down
 * hard so it can never nag (task HARD INVARIANT #2). The repo layer gathers the
 * raw prompt state + milestone signal; this module decides show/no-show and
 * validates the two fields. Keeping the decision here (not in a component or
 * repo) is what makes the "never nag" rule testable.
 *
 * NOTE: none of this ever runs for a child — the widget is parent-side only.
 */

export type FeedbackTrigger = "first_week" | "mastery" | "manual";

/** Real, cheap milestone signals gathered from the family's OWN records. */
export interface FeedbackMilestoneSignal {
  /** Completed lessons across the whole family (activation / "settled in"). */
  completedLessons: number;
  /** Topics certified across the whole family (a genuine mastery moment). */
  certifiedTopics: number;
}

/** Persisted per-parent prompt state (fields on the parent doc). */
export interface FeedbackPromptState {
  lastShownAt: Date | null;
  lastSubmittedAt: Date | null;
  lastDismissedAt: Date | null;
  /** "Don't ask again" — suppresses the prompt durably. */
  optedOut: boolean;
}

/** Family must have done at least this much before we ever ask. */
export const FEEDBACK_MIN_LESSONS = 5;
/** After a submit, stay quiet for ~10 weeks. */
export const FEEDBACK_SUBMIT_COOLDOWN_DAYS = 70;
/** After a dismiss, a shorter ~3-week cool-down. */
export const FEEDBACK_DISMISS_COOLDOWN_DAYS = 21;

/** Free-text comment hard cap (untrusted input — task HARD INVARIANT #3). */
export const FEEDBACK_COMMENT_MAX = 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

function withinDays(then: Date | null, now: Date, days: number): boolean {
  if (!then) return false;
  return now.getTime() - then.getTime() < days * DAY_MS;
}

/**
 * Which milestone (if any) makes a family eligible right now. A certified topic
 * is the strongest positive moment, so it wins; otherwise a family that has
 * completed enough lessons has clearly "settled in". Returns null when no
 * milestone has been reached — the prompt must not appear on first load.
 */
export function feedbackTriggerFor(
  signal: FeedbackMilestoneSignal,
): Exclude<FeedbackTrigger, "manual"> | null {
  if (signal.certifiedTopics >= 1) return "mastery";
  if (signal.completedLessons >= FEEDBACK_MIN_LESSONS) return "first_week";
  return null;
}

export interface FeedbackDecision {
  show: boolean;
  trigger: Exclude<FeedbackTrigger, "manual"> | null;
}

/**
 * The one decision: should the milestone prompt be shown to this parent now?
 * Order matters — opt-out and cooldowns short-circuit BEFORE eligibility so a
 * parent who has just acted is never re-asked, even mid-milestone.
 */
export function shouldShowFeedbackPrompt(
  state: FeedbackPromptState,
  signal: FeedbackMilestoneSignal,
  now: Date = new Date(),
): FeedbackDecision {
  const no: FeedbackDecision = { show: false, trigger: null };

  if (state.optedOut) return no;
  if (withinDays(state.lastSubmittedAt, now, FEEDBACK_SUBMIT_COOLDOWN_DAYS)) {
    return no;
  }
  if (withinDays(state.lastDismissedAt, now, FEEDBACK_DISMISS_COOLDOWN_DAYS)) {
    return no;
  }

  const trigger = feedbackTriggerFor(signal);
  if (!trigger) return no;
  return { show: true, trigger };
}

// ── Input validation (untrusted parent input) ──────────────────────────

/**
 * Coerce a submitted star rating to a valid 1–5 integer, or null if invalid.
 * Accepts numbers or numeric strings (form posts); rejects everything else.
 */
export function validateStars(input: unknown): number | null {
  const n =
    typeof input === "number"
      ? input
      : typeof input === "string" && input.trim() !== ""
        ? Number(input)
        : NaN;
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

/**
 * Sanitize the optional free-text comment: strip control characters (incl. null
 * bytes) other than tab/newline, collapse runs of whitespace, trim, and
 * hard-cap the length. Returns null for an absent/empty comment. Angle brackets
 * are LEFT INTACT — the admin side renders through React (auto-escaped, never
 * dangerouslySetInnerHTML), so mangling the text here would only corrupt
 * legitimate comments.
 */
export function sanitizeComment(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const noCr = input.replace(/\r\n?/g, "\n");
  // Strip control chars EXCEPT tab (\x09) and newline (\x0A).
  const stripped = noCr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const collapsed = stripped
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  const trimmed = collapsed.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, FEEDBACK_COMMENT_MAX);
}

/** Whether a trigger value from the client is one we accept. */
export function isValidTrigger(input: unknown): input is FeedbackTrigger {
  return input === "first_week" || input === "mastery" || input === "manual";
}
