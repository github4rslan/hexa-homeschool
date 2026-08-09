# North-star backlog (Scout + Mechanic compass)

Larger exam-readiness EPICS that nightly findings ladder toward. Read this first
each run: prefer findings that advance an active epic, and break the next slice of
an epic into today's `F#` items. Refresh at the end (mark progress, retire finished
epics, add any big goal a finding implies). A handful of live epics is plenty. This
is a compass, not a spec. Newest note at the bottom of each epic.

North star: get a child to comfort, confidence and success in their real GCSE
exams (Edexcel Maths 1MA1, AQA English 8700, AQA Combined Science Trilogy 8464).

---

## EPIC 1 — Verified, correct question bank across every spec point
Status: ACTIVE. The existing bank (~140 human-authored items across 5 seed files)
is arithmetically/factually clean (re-audited 2026-08-08 and again 2026-08-09).
- Next step: continue a rolling per-subject correctness re-audit each run; note
  that a "retire" of a seed question must delete the orphaned old doc (seed never
  deletes), not just reword the prompt.
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); B3 sci_body water-absorption item retired + reworded + orphan
  deleted (2026-08-09); curriculum.seed.extra.ts + the F7 exam-style items + F8
  mensuration re-derived clean again (2026-08-09 Scout) — no correctness bugs.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline). The bank is almost all single-step recall MCQs; real
papers use command words (calculate, work out, show that, explain, describe,
compare) and multi-step reasoning.
- Next step: keep adding command-word items per topic each run until every KS4
  topic has >= 2 (Scout authors, Mechanic transcribes verbatim + seeds). Still
  uncovered after this run: maths_sequences/graphs/quadratics/geometry, most
  science topics, most English topics.
- Done so far: 6 spec-mapped exam-style questions (F7, 2026-08-09) across
  maths_fractions/ratio/number, sci_forces/reactions, eng_devices; 5 MORE authored
  2026-08-09 (Scout F1) for maths_algebra_linear (Solve), maths_pythagoras
  (Calculate), maths_statistics (Work out — probability), sci_electricity
  (Calculate V=IR), eng_analysis (Explain — simile effect) — pending seed.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. Thin areas still to scope: simultaneous equations, transformations,
probability trees (Maths); required-practical recall, key equations (Science);
extract-based language analysis (English).
- Next step: seed the `maths_inequalities` topic (Scout F1/F2 2026-08-09 authored
  3 starters + proposed worked example) then tackle simultaneous equations /
  transformations. Extend the `maths_mensuration` bank beyond the 3 starters.
- Done so far: `maths_mensuration` strand added + 3 checked starters seeded; mock
  unlock made a reachable count-driven floor (`lib/engine/mock-gate.ts`) so adding
  topics can't break the mock (F8, 2026-08-09). Inequalities strand authored
  (2026-08-09 Scout F2), pending Mechanic seed + worked example.

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE. Later: mark-weighted multi-step items, honest grade boundaries
surfaced to the parent.
- Next step: mark-weighting + surfacing grade boundaries; live-drive the F9 exam
  framing screen once a test child has an unlocked mock (>=10 certified).
- Done so far: calculator vs non-calculator framing + readiness-tiered paper
  (Foundation/Higher window, always-fills fallback) via `lib/engine/mock-paper.ts`
  (F9, 2026-08-09). Gate-verified + unit-tested; framing screen needs an unlocked
  mock to drive live.

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on the child side). Spaced-rep warm-up + readiness
trajectory schedule deterministically from certification dates/scores (non-profiling).
- Next step: give the PARENT visibility of review debt (2026-08-09 Scout F8: a
  "topics due for review" line in the weekly digest), so skipped reviews get a
  gentle parent nudge before topics decay.
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); CONFIRMED the spacing curve widens — a correct recall doubles the
  interval (capped 90 days), an incorrect one resets to 7 (`spaced-repetition.ts`,
  verified 2026-08-09). The child-side loop is solid; remaining gap is parent-facing.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Rich motion already exists
(mcq settle, star burst, confetti, phase bar, week strip, mascot mood).
- Next step: keep proposing supportive wrong-answer motion that never flashes
  red / shakes / buzzes; look for the next un-celebrated moment. 2026-08-09 Scout
  F6: warm hint-card entrance + a calm one-time "See it" beckon on a miss.
- Done so far: every interaction type now has its own correct-answer settle —
  tap_reveal + drag_drop got the accent sweep + drawn check (F11, 2026-08-09).

## EPIC 7 (new, background) — Stay on the current stack
Status: ACTIVE. Next 16 + framer-motion→motion + several majors are now GA.
- Next step: evaluate + stage Next.js 16 (2026-08-09 Scout F4), then the motion/
  lucide/tailwind-merge/eslint-10 majors (F5), and keep the in-range drift fresh (F3).
  Pair the nonce-based CSP hardening (F7) with the Next 16 move.
- Done so far: nothing landed yet; audit stays at 0 vulnerabilities.
