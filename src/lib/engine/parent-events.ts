/**
 * Parent milestone events — deterministic copy, no AI. Turns a real learning
 * moment (a topic mastered, a five-attempt handoff, an inactivity nudge) into
 * warm, specific, honest language for BOTH the dashboard activity feed and the
 * email/SMS push. Pure functions, unit-tested in tests/.
 *
 * STRICT framing rules (brief + Children's Code):
 *  - Every figure is REAL — computed upstream from the child's own record. This
 *    module only phrases it; it never invents or inflates.
 *  - Encouraging and never a "behind"/deficit label. A struggle is framed as
 *    "finding it tricky — extra help is lined up", never as failure.
 *  - The inactivity line is a PARENT reminder ("hasn't logged in today"), never
 *    a child-facing engagement hook.
 */

export type ParentEventType = "mastery" | "handoff" | "inactivity";

export interface ParentEventCopyInput {
  type: ParentEventType;
  /** Child's first name (already split from the full name). */
  childFirstName: string;
  /** Topic title for mastery/handoff; ignored for inactivity. */
  topicTitle?: string | null;
  /** Mastery only: attempts it took to certify (≥ 1). */
  attempts?: number | null;
}

export interface ParentEventCopy {
  /** Short feed headline, e.g. "Mastered Fractions". */
  feedTitle: string;
  /** Feed sub-line, e.g. "Ada · first try 🎉". */
  feedDetail: string;
  /** Email subject line. */
  emailSubject: string;
  /** Email H1. */
  emailHeadline: string;
  /** One warm email paragraph (plain text; the template wraps it). */
  emailBody: string;
  /** Email button label. */
  emailCta: string;
  /** SMS body (short, calm, no alarming detail). */
  smsBody: string;
}

/** "first try" / "2 attempts" / "5 attempts" — honest, kind attempt phrasing. */
export function attemptsPhrase(attempts: number | null | undefined): string {
  if (!attempts || attempts <= 1) return "first try";
  return `${attempts} attempts`;
}

/**
 * Build the deterministic copy for one parent event. Falls back to a safe
 * generic topic word when a title is missing, so a legacy row never renders a
 * blank line.
 */
export function buildParentEventCopy(
  input: ParentEventCopyInput,
): ParentEventCopy {
  const name = input.childFirstName;
  const topic = (input.topicTitle ?? "").trim() || "a new topic";

  switch (input.type) {
    case "mastery": {
      const tries = attemptsPhrase(input.attempts);
      return {
        feedTitle: `Mastered ${topic}`,
        feedDetail: `${name} · ${tries} 🎉`,
        emailSubject: `${name} mastered ${topic} 🎉`,
        emailHeadline: `${name} mastered ${topic}!`,
        emailBody: `${name} just certified ${topic} — ${tries}. Every question in the mastery check was correct, with no hints on the final set. A lovely moment worth celebrating together.`,
        emailCta: "See the progress",
        smsBody: `Edway: ${name} mastered ${topic} today (${tries}) 🎉`,
      };
    }
    case "handoff": {
      return {
        feedTitle: `Extra help lined up for ${topic}`,
        feedDetail: `${name} · a tutor is coming`,
        emailSubject: `${name} could use extra help with ${topic}`,
        emailHeadline: "Extra help is lined up",
        emailBody: `${name} found ${topic} tricky, so Edway gently paused that topic and queued a tutor request. Nothing is marked against them — other lessons stay available, and this topic can continue with human support.`,
        emailCta: "View the tutoring request",
        smsBody: `Edway: ${name} is finding ${topic} tricky. We've paused it and queued extra tutor help.`,
      };
    }
    case "inactivity": {
      return {
        feedTitle: "No lesson yet today",
        feedDetail: `${name} · a gentle reminder`,
        emailSubject: `A gentle reminder about ${name}'s lessons`,
        emailHeadline: `${name} hasn't logged in today`,
        emailBody: `Just a gentle nudge — ${name} hasn't started a lesson today yet. No pressure at all; some days are quieter than others. Whenever it suits, today's quests are ready and waiting.`,
        emailCta: "Open the dashboard",
        smsBody: `Edway: a gentle reminder — ${name} hasn't started a lesson today. Their quests are ready whenever it suits.`,
      };
    }
  }
}
