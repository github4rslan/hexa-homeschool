# Glob: src/app/(child)/**,src/lib/safety/**,src/lib/ai/**,src/app/api/tutor/**,src/app/api/tts/**

## Child-Safety Constraints

This code serves children directly. The following are hard invariants — if a
requested change would violate one, stop and flag it instead of implementing:

1. **No unchecked AI output to children.** Every AI explanation must pass the
   Teaching Checker (≥ 95% confidence) before rendering in `(child)` routes;
   on rejection, serve the human-authored fallback. Never lower the threshold,
   skip the checker, or stream raw completions to a child-facing component.

2. **Distress gate runs first.** In `/api/tutor`, `checkDistress()` must run on
   child-entered text BEFORE any AI call, and a match must short-circuit:
   freeze session → record escalation → calm pause screen. Do not reorder,
   debounce, or make it best-effort. Over-triggering is acceptable; missing
   real distress is not.

3. **Escalation scope is fixed.** The matcher does educational safeguarding
   only: freeze, notify parent, log. Do not add clinical/behavioural profiling,
   sentiment scoring, or anything that builds a psychological profile of a child.

4. **Ownership checks are non-negotiable.** Any query touching child data goes
   through `lib/db/repo.ts` with its ownership check. Direct `getCollection`
   calls on child-scoped collections are a compliance bug.

5. **AI never authors curriculum.** Questions and canonical answers are
   human-authored. OpenAI explains against the canonical answer — do not add
   features that have the model generate questions, answers, or grading truth.

6. **Tone**: child-facing copy is encouraging and never condescending; the
   checker validates this for AI output — keep the same bar for hardcoded copy.

When changing escalation phrases or severities, update the audit-relevant docs
(`docs/AI-AGENTS.md`) in the same change.
