/**
 * Achievement shelf (F10) — pure selection of a child's earned topic badges.
 *
 * Each certified topic becomes a collectible badge on "My journey": a warm,
 * visible record of progress, not just an incremented count. Fully
 * deterministic — read-only over the competence map, no analytics, no profiling
 * (Children's Code safe). This module is the pure selector; the component only
 * renders what it returns.
 */

export interface BadgeSourceNode {
  topicTag: string;
  title: string;
  state: "locked" | "training" | "certified";
  certifiedAt: Date | null;
}

export interface SubjectBadgeSource {
  subject: string;
  /** Accent key for the subject (violet / cyan / neon). */
  accent: string;
  nodes: BadgeSourceNode[];
}

export interface EarnedBadge {
  topicTag: string;
  title: string;
  subject: string;
  accent: string;
  certifiedAt: Date | null;
}

export interface AchievementShelf {
  badges: EarnedBadge[];
  earnedCount: number;
  totalCount: number;
}

/**
 * Build the shelf from the per-subject competence map. Earned badges are the
 * certified topics across all subjects, ordered **most-recently earned first**
 * (topics with no date sort last, keeping their subject order). `totalCount` is
 * every topic, so the UI can show earned-vs-locked without another pass.
 */
export function buildAchievementShelf(
  subjects: SubjectBadgeSource[],
): AchievementShelf {
  const badges: EarnedBadge[] = [];
  let totalCount = 0;

  for (const s of subjects) {
    for (const n of s.nodes) {
      totalCount += 1;
      if (n.state === "certified") {
        badges.push({
          topicTag: n.topicTag,
          title: n.title,
          subject: s.subject,
          accent: s.accent,
          certifiedAt: n.certifiedAt,
        });
      }
    }
  }

  badges.sort((a, b) => {
    const at = a.certifiedAt ? a.certifiedAt.getTime() : -Infinity;
    const bt = b.certifiedAt ? b.certifiedAt.getTime() : -Infinity;
    return bt - at; // most recent first; undated fall to the end
  });

  return { badges, earnedCount: badges.length, totalCount };
}
