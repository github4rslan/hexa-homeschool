/**
 * F3: pure copy selection for the "review" framing shown when a child
 * re-enters an already-certified topic, so re-doing a topic never looks or
 * reads identical to earning it for the first time (ties directly to B2:
 * the dashboard now agrees a certified topic is "done", so the child-facing
 * surface should never contradict that by re-claiming a first mastery).
 *
 * Pure and presentational only: never reads or writes scoring, hints or
 * mastery-cap state.
 */

export interface CompletionCopy {
  heading: string;
  subtitle: string;
}

/**
 * Choose the completion-screen heading + subtitle for the four combinations
 * of "mastered this attempt" × "topic was already certified before this
 * attempt (isReview)".
 */
export function completionCopy(input: {
  mastered: boolean;
  isReview: boolean;
}): CompletionCopy {
  const { mastered, isReview } = input;
  if (mastered) {
    return isReview
      ? {
          heading: "Still mastered! ⭐",
          subtitle: "Great review, you've still got this locked in! 🎉",
        }
      : {
          heading: "Topic mastered!",
          subtitle: "You answered everything correctly. This topic is certified! 🎉",
        };
  }
  return isReview
    ? {
        heading: "Great effort!",
        subtitle:
          "This topic is already certified from before. No worries, keep practising for fun!",
      }
    : {
        heading: "Great effort!",
        subtitle: "Keep going, you can master this topic next time.",
      };
}

/** The Explainer's small acknowledging chip text for a reviewed topic. */
export const REVIEW_CHIP_TEXT =
  "You've already mastered this: great for keeping it fresh!";
