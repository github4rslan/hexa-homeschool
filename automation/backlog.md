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
is arithmetically/factually clean (audited 2026-08-08) with one ambiguous item.
- Next step: fix/retire the one ambiguous canonical answer (B3, sci_body water
  absorption), then continue a rolling per-subject correctness re-audit each run.
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); found the bank clean bar B3.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline). The bank is almost all single-step recall MCQs; real
papers use command words (calculate, work out, show that, explain, describe,
compare) and multi-step reasoning.
- Next step: seed the 6 authored exam-style questions (F7, 2026-08-08), then keep
  adding command-word items per topic each run until every KS4 topic has >= 2.
- Done so far: 6 spec-mapped exam-style questions authored in full for review
  (F7).

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. Biggest hole found: GCSE Maths mensuration (area / perimeter /
volume / circles) is entirely absent; `maths_geometry` is angles only. Other thin
areas to scope later: probability trees, inequalities, simultaneous equations,
transformations (Maths); required-practical recall, key equations (Science);
extract-based language analysis (English).
- Next step: add the `maths_mensuration` strand + starter questions (F8,
  2026-08-08), and make the mock "10 certified" gate count-driven so new topics
  do not break the unlock.

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE. The mock is a flat 15-min 10-MCQ paper with no calc/non-calc
framing, no tier targeting, no mark weighting.
- Next step: calculator vs non-calculator framing + tier-targeted paper drawn from
  readiness (F9, 2026-08-08). Later: mark-weighted multi-step items, honest grade
  boundaries surfaced to the parent.

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE. Spaced-rep warm-up + readiness trajectory exist and schedule
deterministically from certification dates/scores (non-profiling).
- Next step: interleave topics/subjects in the daily warm-up instead of blocking a
  single topic (F10, 2026-08-08). Later: surface a "review due" nudge and confirm
  the spacing curve widens as a topic is repeatedly recalled.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Rich motion already exists
(mcq settle, star burst, confetti, phase bar, week strip, mascot mood).
- Next step: give every interaction type its own correct-answer settle
  (tap_reveal + drag_drop, F11, 2026-08-08). Keep proposing supportive
  wrong-answer motion that never flashes red / shakes / buzzes.
