/**
 * Daily-quest topic selection (pure).
 *
 * A tapped quest must always open a real lesson — never the calm "this quest
 * isn't ready yet" wall. So the topic a subject's quest points at is chosen from
 * the child's in-band topics, preferring the parent-planned one, but ALWAYS
 * requiring that the topic actually has a playable question bank in that band.
 * When no in-band topic has a lesson yet (an unseeded subject like KS3 Science)
 * the caller renders the subject as "coming soon" instead of a dead-wall link.
 *
 * Framework-free + deterministic so both `repo.ts` (schedule build + hub
 * resolution) and Vitest share one source of truth. No React, no DB, no
 * "server-only".
 */

export interface QuestTopicLike {
  topic_tag: string;
  title: string;
}

/**
 * Pick the in-band topic a quest should open, or null when the in-band set has
 * no playable lesson:
 *   1) the parent-planned topic, if it's in-band AND has a lesson;
 *   2) the next uncertified in-band topic that has a lesson;
 *   3) any in-band topic that has a lesson (band fully certified but reviewable).
 */
export function pickPlayableQuestTopic<T extends QuestTopicLike>(input: {
  inBand: T[];
  certified: Set<string>;
  playable: Set<string>;
  plannedTag?: string | null;
}): T | null {
  const { inBand, certified, playable, plannedTag } = input;

  if (plannedTag) {
    const planned = inBand.find((t) => t.topic_tag === plannedTag);
    if (planned && playable.has(planned.topic_tag)) return planned;
  }

  return (
    inBand.find(
      (t) => !certified.has(t.topic_tag) && playable.has(t.topic_tag),
    ) ??
    inBand.find((t) => playable.has(t.topic_tag)) ??
    null
  );
}

/**
 * The schedule builder's variant: same playable-first preference, but never
 * returns null when the band has topics — it falls back to the next uncertified
 * (then the first) in-band topic so plan generation never regresses to an empty
 * day. The hub still guards the tapped link, so a fallback topic without a
 * lesson simply surfaces as "coming soon" rather than a wall.
 */
export function pickScheduleQuestTopic<T extends QuestTopicLike>(input: {
  inBand: T[];
  certified: Set<string>;
  playable: Set<string>;
}): T | null {
  const { inBand, certified, playable } = input;
  return (
    pickPlayableQuestTopic({ inBand, certified, playable }) ??
    inBand.find((t) => !certified.has(t.topic_tag)) ??
    inBand[0] ??
    null
  );
}
