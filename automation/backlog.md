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
Status: ACTIVE. The existing bank (~130 human-authored items across 5 seed files)
is arithmetically/factually clean (audited 2026-08-08) with one ambiguous item,
now fixed.
- Next step: continue a rolling per-subject correctness re-audit each run; note
  that a "retire" of a seed question must delete the orphaned old doc (seed never
  deletes), not just reword the prompt.
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); B3 sci_body water-absorption item retired + reworded + orphan
  deleted from the live bank (2026-08-09).

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline). The bank is almost all single-step recall MCQs; real
papers use command words (calculate, work out, show that, explain, describe,
compare) and multi-step reasoning.
- Next step: keep adding command-word items per topic each run until every KS4
  topic has >= 2 (Scout authors, Mechanic transcribes verbatim + seeds).
- Done so far: 6 spec-mapped exam-style questions authored + seeded live
  (F7, 2026-08-09) across maths_fractions/ratio/number, sci_forces/reactions,
  eng_devices.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. Other thin areas to scope next: probability trees, inequalities,
simultaneous equations, transformations (Maths); required-practical recall, key
equations (Science); extract-based language analysis (English).
- Next step: extend the `maths_mensuration` bank beyond the 3 starters (owner to
  add), then tackle the next missing strand above.
- Done so far: `maths_mensuration` strand (area/perimeter/volume/circles) added +
  3 checked starters seeded; mock unlock made a reachable count-driven floor
  (`lib/engine/mock-gate.ts`) so adding topics can't break the mock (F8,
  2026-08-09). NOTE: the mock gate was already a fixed floor, so the real risk was
  RAISING it to the topic count, not the reverse; kept it a floor.

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
Status: ACTIVE. Spaced-rep warm-up + readiness trajectory exist and schedule
deterministically from certification dates/scores (non-profiling).
- Next step: surface a "review due" nudge on the hub and confirm the spacing curve
  widens as a topic is repeatedly recalled.
- Done so far: warm-up now interleaves across subjects (`interleaveDueReviews`,
  most-overdue still leads) instead of blocking one topic; live-verified Ivy's
  warm-up ran maths -> science -> maths (F10, 2026-08-09).

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Rich motion already exists
(mcq settle, star burst, confetti, phase bar, week strip, mascot mood).
- Next step: keep proposing supportive wrong-answer motion that never flashes
  red / shakes / buzzes; look for the next un-celebrated correct moment.
- Done so far: every interaction type now has its own correct-answer settle —
  tap_reveal + drag_drop got the accent sweep + drawn check on the child's own
  correct pick (F11, 2026-08-09, live-verified on a drag_drop).
