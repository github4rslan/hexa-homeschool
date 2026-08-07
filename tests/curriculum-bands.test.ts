import { describe, expect, it } from "vitest";
import { SEED_TOPICS, SEED_QUESTIONS } from "@/lib/data/curriculum.seed";
import { SEED_QUESTIONS_FOUNDATION } from "@/lib/data/curriculum.seed.foundation";
import {
  SEED_TOPICS_BANDS,
  SEED_QUESTIONS_BANDS,
} from "@/lib/data/curriculum.seed.bands";

const ALL_TOPICS = [...SEED_TOPICS, ...SEED_TOPICS_BANDS];

describe("age-banded curriculum integrity", () => {
  it("covers KS2 and KS3 for every subject", () => {
    for (const subject of ["mathematics", "english", "science"] as const) {
      for (const band of [2, 3] as const) {
        const inBand = SEED_TOPICS_BANDS.filter(
          (t) => t.subject === subject && t.key_stage === band,
        );
        expect(inBand.length, `${subject} KS${band}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("gives every band topic ≥3 practice and ≥3 mastery questions", () => {
    for (const topic of SEED_TOPICS_BANDS) {
      const qs = SEED_QUESTIONS_BANDS.filter((q) => q.topic_tag === topic.topic_tag);
      const practice = qs.filter((q) => q.kind === "practice");
      const mastery = qs.filter((q) => q.kind === "mastery");
      expect(practice.length, `${topic.topic_tag} practice`).toBeGreaterThanOrEqual(3);
      expect(mastery.length, `${topic.topic_tag} mastery`).toBeGreaterThanOrEqual(3);
    }
  });

  it("tags every band question with its topic's key stage", () => {
    const bandByTag = new Map(SEED_TOPICS_BANDS.map((t) => [t.topic_tag, t.key_stage]));
    for (const q of SEED_QUESTIONS_BANDS) {
      expect(q.key_stage).toBe(bandByTag.get(q.topic_tag));
      expect(q.key_stage === 2 || q.key_stage === 3).toBe(true);
    }
  });

  it("has exactly one valid correct_index per band question", () => {
    for (const q of SEED_QUESTIONS_BANDS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps any authored post-mastery 'stretch' bonus questions well-formed and ≤1 per topic (F6)", () => {
    const stretch = SEED_QUESTIONS_BANDS.filter((q) => q.kind === "stretch");
    // We authored some stretch questions this run.
    expect(stretch.length).toBeGreaterThan(0);
    // The child flow serves the FIRST stretch question, so a topic must not
    // carry more than one (avoids an ambiguous bonus).
    const byTopic = new Map<string, number>();
    for (const q of stretch) {
      byTopic.set(q.topic_tag, (byTopic.get(q.topic_tag) ?? 0) + 1);
      // Same validity bar as every other question (also covered above).
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
    for (const [tag, n] of byTopic) {
      expect(n, `${tag} stretch count`).toBeLessThanOrEqual(1);
    }
  });

  it("has no orphan question tags (every question maps to a topic)", () => {
    const tags = new Set(ALL_TOPICS.map((t) => t.topic_tag));
    for (const q of [...SEED_QUESTIONS, ...SEED_QUESTIONS_FOUNDATION, ...SEED_QUESTIONS_BANDS]) {
      expect(tags.has(q.topic_tag), `orphan tag: ${q.topic_tag}`).toBe(true);
    }
  });

  it("uses topic_tags distinct from the GCSE bank", () => {
    const gcseTags = new Set(SEED_TOPICS.map((t) => t.topic_tag));
    for (const t of SEED_TOPICS_BANDS) {
      expect(gcseTags.has(t.topic_tag), `collision: ${t.topic_tag}`).toBe(false);
    }
  });
});
