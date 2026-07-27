/**
 * In-lesson tap-to-define glossary (F9 — SEND / EAL comprehension support).
 *
 * Definitions are HUMAN-AUTHORED curriculum data attached to a topic
 * (`CurriculumTopicDoc.glossary`) — the model never authors them, the same rule
 * as questions and answers (child-safety rule 5). This module is the pure,
 * deterministic matcher: given a block of prose and the topic's glossary, it
 * splits the text into plain and defined segments so a component can wrap the
 * defined ones in an accessible popover. No React, no DB, no network.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export type GlossarySegment =
  | { kind: "text"; text: string }
  | { kind: "term"; text: string; definition: string };

/** Validate DB glossary rows → trimmed, de-duped, non-empty entries. */
export function normaliseGlossary(raw: unknown): GlossaryTerm[] {
  if (!Array.isArray(raw)) return [];
  const out: GlossaryTerm[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const term = (entry as { term?: unknown }).term;
    const definition = (entry as { definition?: unknown }).definition;
    if (typeof term !== "string" || typeof definition !== "string") continue;
    const t = term.trim();
    const d = definition.trim();
    if (!t || !d) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ term: t, definition: d });
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` into segments, marking the FIRST whole-word occurrence of each
 * glossary term (case-insensitive) as a defined segment. Only the first hit per
 * term is highlighted so a repeated word doesn't clutter the passage. Longer
 * terms win over shorter overlapping ones. Returns a single text segment when
 * there's nothing to match (the common, glossary-free case).
 */
export function splitByGlossary(
  text: string,
  terms: GlossaryTerm[],
): GlossarySegment[] {
  if (!text) return [];
  const valid = normaliseGlossary(terms);
  if (valid.length === 0) return [{ kind: "text", text }];

  const defByLower = new Map(valid.map((t) => [t.term.toLowerCase(), t.definition]));
  // Longest first so "common denominator" beats "denominator".
  const pattern = valid
    .slice()
    .sort((a, b) => b.term.length - a.term.length)
    .map((t) => escapeRegExp(t.term))
    .join("|");
  const re = new RegExp(`\\b(?:${pattern})\\b`, "gi");

  const segments: GlossarySegment[] = [];
  const used = new Set<string>();
  let last = 0;
  for (const m of text.matchAll(re)) {
    const matched = m[0];
    const key = matched.toLowerCase();
    const definition = defByLower.get(key);
    if (!definition || used.has(key)) continue; // already highlighted once
    used.add(key);
    const index = m.index ?? 0;
    if (index > last) segments.push({ kind: "text", text: text.slice(last, index) });
    segments.push({ kind: "term", text: matched, definition });
    last = index + matched.length;
  }
  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}
