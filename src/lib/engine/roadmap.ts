/**
 * Pure helper for the parent-facing per-child curriculum roadmap (F4).
 *
 * Given the ordered topics in a child's current band for a subject and the set
 * of topic_tags they've certified, classify each topic as already **certified**,
 * the **current** focus (the first uncertified topic in order), or **upcoming**.
 * Deterministic + IO-free so it's unit-tested; the repo layer supplies the
 * ownership-checked band topics + competence set. Parent-only planning view — the
 * band language is never shown to the child.
 */

export type RoadmapState = "certified" | "current" | "upcoming";

export interface RoadmapTopicInput {
  topic_tag: string;
  title: string;
  /** GCSE working-grade band, e.g. "Grade 3–5" — parent-only context (F8). */
  working_grade_band?: string | null;
}

export interface RoadmapTopic {
  topicTag: string;
  title: string;
  state: RoadmapState;
  workingGradeBand: string | null;
}

/**
 * Classify the band's ordered topics against the certified set. Exactly one
 * uncertified topic — the first in order — is marked "current"; the rest are
 * "upcoming". A fully-certified band yields all "certified" (the child is about
 * to advance a band).
 */
export function buildRoadmapTopics(
  inBandOrdered: RoadmapTopicInput[],
  certified: Set<string>,
): RoadmapTopic[] {
  let currentAssigned = false;
  return inBandOrdered.map((t) => {
    const workingGradeBand = t.working_grade_band ?? null;
    if (certified.has(t.topic_tag)) {
      return { topicTag: t.topic_tag, title: t.title, state: "certified" as const, workingGradeBand };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { topicTag: t.topic_tag, title: t.title, state: "current" as const, workingGradeBand };
    }
    return { topicTag: t.topic_tag, title: t.title, state: "upcoming" as const, workingGradeBand };
  });
}
