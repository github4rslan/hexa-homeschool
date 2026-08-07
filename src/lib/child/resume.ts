/**
 * Pure helpers for the child hub "Continue where you left off" resume card.
 *
 * The interactive daily flow autosaves mid-lesson to `lesson_progress` (one row
 * per child per topic, deleted on completion). The hub surfaces those genuinely
 * in-progress lessons as a warm resume card so a child who stepped away doesn't
 * land on an undifferentiated grid. IO-free + deterministic so it's unit-tested;
 * the repo layer feeds it ownership-checked rows.
 */

import type { Subject } from "@/lib/db/types";

/** A raw in-progress lesson row (shape mirrors LessonProgressDoc, IO-free). */
export interface InProgressRow {
  topic_tag: string;
  /** Step the child was on (0-based). */
  step: number;
  /** Question count when saved. */
  total: number;
  updated_at: Date;
}

/** Topic metadata used to label a resume card. */
export interface TopicMeta {
  title: string;
  subject: Subject;
}

/** A display-ready resume card. */
export interface ResumeCard {
  topicTag: string;
  title: string;
  subject: Subject;
  /** 1-based step the child will land back on. */
  current: number;
  /** Total steps in the lesson's practice set. */
  total: number;
  /** Progress percentage (0–100, rounded). */
  pct: number;
}

/**
 * Build the resume cards from raw in-progress rows + a topic metadata lookup.
 *
 * A row is only surfaced when it is genuinely mid-lesson — matching the
 * `resolveResumeStep` guards (a save past the start, before the end, with a
 * known topic). Most-recently-touched first so the card the child is likeliest
 * to want leads.
 */
export function buildResumeCards(
  rows: InProgressRow[],
  meta: Map<string, TopicMeta>,
): ResumeCard[] {
  return rows
    .filter(
      (r) =>
        Number.isFinite(r.step) &&
        Number.isFinite(r.total) &&
        r.total > 0 &&
        r.step > 0 &&
        r.step < r.total &&
        meta.has(r.topic_tag),
    )
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .map((r) => {
      const m = meta.get(r.topic_tag)!;
      return {
        topicTag: r.topic_tag,
        title: m.title,
        subject: m.subject,
        current: r.step + 1,
        total: r.total,
        pct: Math.round((r.step / r.total) * 100),
      };
    });
}
