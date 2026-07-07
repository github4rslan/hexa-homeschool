/**
 * Eddie's conversational copy engine (Wave 8, Phase 3).
 *
 * Pure, deterministic, human-authored templates that make Coach Eddie talk
 * DIRECTLY to this child — by first name, in second person, reacting to the
 * exact answer they picked — while staying completely on-rails
 * (.claude/rules/child-safety.md): no open-ended chat, no personal-data
 * solicitation, never punitive, always age-appropriate. AI may only replace a
 * line through the separate Checker-gated path; these templates are the floor
 * and the fallback.
 *
 * Framework-free and import-safe from client components and Vitest — keep it
 * that way (no React, no "server-only").
 */

import type { OptionFate } from "@/lib/child/animation-timeline";

/**
 * Sanitize a profile first name for display + speech. Only the FIRST name is
 * ever used (never any other personal data), it must look like a real name
 * (letters, hyphen, apostrophe; 2–20 chars), and anything unusable degrades
 * to null — Eddie then speaks warmly without a name.
 */
export function safeFirstName(name?: string | null): string | null {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,20}$/.test(first)) {
    return null;
  }
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** ", Aisha" — or nothing, cleanly. */
function withName(name: string | null): string {
  return name ? `, ${name}` : "";
}

/**
 * Eddie reacts to the EXACT wrong answer (second person, specific, warm):
 *  - the ± near-miss ("half" fate) is affirmed as half right, then Eddie asks
 *    for the other half — ask, then wait;
 *  - a targeted misconception line rides along when one is authored;
 *  - otherwise the adaptive-matrix message is personalised.
 * Every branch is a fixed human-authored template — on-rails by construction.
 */
export function eddieWrongAnswerLine(input: {
  name: string | null;
  /** The option text the child actually chose (mcq), or null. */
  chosenOption: string | null;
  /** The chosen option's fate from `classifyOptions`, or null. */
  fate: OptionFate | null;
  /** The authored misconception line for that option, or null. */
  misconception: string | null;
  /** The adaptive-matrix message (deterministic fallback base). */
  baseMessage: string;
}): string {
  const { name, chosenOption, fate, misconception, baseMessage } = input;

  if (fate === "half" && chosenOption) {
    return `You picked ${chosenOption} — good thinking, that's one of the two answers. Can you spot the other one${withName(name)}?`;
  }

  if (misconception && chosenOption) {
    return `You picked ${chosenOption}${withName(name)}. ${misconception} Have another look — what would you try now?`;
  }

  if (misconception) {
    return `${misconception} Have another go${withName(name)} — what would you try now?`;
  }

  return name ? `${name}, ${lowerFirst(baseMessage)}` : baseMessage;
}

/** Eddie's warm confirm for a correct answer — spoken, second person. */
export function eddieCorrectLine(name: string | null): string {
  return name
    ? `Yes, ${name} — that's exactly it. Lovely thinking.`
    : "Yes — that's exactly it. Lovely thinking.";
}

/**
 * Personalise a "Your turn" prompt so the ask-then-wait beat sounds like
 * Eddie talking to THIS child: "Your turn, Aisha — where does x land?".
 * Prompts that don't start with the standard lead pass through unchanged.
 */
export function personalizeYourTurnPrompt(
  prompt: string,
  name: string | null,
): string {
  if (!name) return prompt;
  if (prompt.startsWith("Your turn — ")) {
    return prompt.replace("Your turn — ", `Your turn, ${name} — `);
  }
  return prompt;
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}
