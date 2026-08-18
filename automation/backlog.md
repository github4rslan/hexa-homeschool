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
Status: ACTIVE. The existing bank (~150 human-authored items across 5 seed files)
is arithmetically/factually clean (re-audited 2026-08-08, 08-09, and again the 17
EXAM_STYLE_QUESTIONS on 2026-08-14).
- Next step: continue a rolling per-subject correctness re-audit each run; note
  that a "retire" of a seed question must delete the orphaned old doc (seed never
  deletes), not just reword the prompt.
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); B3 sci_body water-absorption item retired + reworded + orphan
  deleted (2026-08-09); curriculum.seed.extra.ts + the F7 exam-style items + F8
  mensuration re-derived clean (2026-08-09); all 17 EXAM_STYLE_QUESTIONS
  re-derived clean again (2026-08-14 Scout) — no correctness bugs.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline). The bank is almost all single-step recall MCQs; real
papers use command words (calculate, work out, show that, explain, describe,
compare) and multi-step reasoning.
- Next step: keep adding command-word items per topic each run until every KS4
  topic has >= 2 (Scout authors, Mechanic transcribes verbatim + seeds). Still
  uncovered after this run: most remaining English topics (punctuation, spelling,
  creative, poetry, Shakespeare). sci_states and eng_grammar both got their FIRST
  command-word item this run (2026-08-18 second pass, F9/F10, pending seed) —
  sci_states was the last science topic with zero exam-style items.
  sci_atoms/sci_energy/eng_comprehension/eng_persuasive each now have one
  command-word item authored (2026-08-18 Scout F1-F4, pending seed);
  sci_cells/sci_body/maths_quadratics each now have one command-word item
  authored (2026-08-14 Scout F1/F2/F3, SHIPPED + live-verified — the sci_cells
  magnification item was answered live in a 2026-08-18 second-pass lesson drive).
- Done so far: 6 spec-mapped exam-style questions (F7, 2026-08-09) across
  maths_fractions/ratio/number, sci_forces/reactions, eng_devices; 5 MORE authored
  2026-08-09 (Scout F1) for maths_algebra_linear (Solve), maths_pythagoras
  (Calculate), maths_statistics (Work out, probability), sci_electricity
  (Calculate V=IR), eng_analysis (Explain, simile effect). 6 MORE 2026-08-11
  (Scout F3+F4): maths_sequences, maths_geometry, maths_graphs, sci_forces
  (acceleration), sci_reactions (Mr), eng_analysis (metaphor). 3 MORE authored
  2026-08-14 (Scout F1/F2/F3): sci_cells (Calculate magnification), sci_body
  (Explain artery walls), maths_quadratics (Solve mixed-sign quadratic) — SHIPPED
  2026-08-18. 4 MORE authored 2026-08-18 first pass (Scout F1-F4): sci_atoms
  (Calculate neutrons), sci_energy (Calculate Ek), eng_comprehension (retrieval),
  eng_persuasive (identify technique) — SHIPPED same day. 2 MORE authored
  2026-08-18 second pass (Scout F9/F10): sci_states (Calculate density, AQA
  8464 Physics 4.5.1), eng_grammar (identify subject-verb agreement, AQA 8700
  AO6) — pending seed.

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
Status: ACTIVE, further along than previously tracked. Re-read the engine +
player 2026-08-18 (second pass): a real gentle countdown timer AND the marks/
boundary-grade work are BOTH already shipped and calm (`mock-exam-player.tsx`
has a live `mm:ss` countdown that only tints amber under 60s and auto-submits at
zero — no alarm, no red; `mock-exam.ts` has marksTotal/marksEarned/marksPct and
`gradeForMarks` is wired parent-side). Do not re-propose a mock timer.
- Next step: live-drive the F7 (2026-08-14) exam-boundary-grade card once a test
  child crosses the reachable mock-unlock floor (10 certified topics per subject)
  — still not reached by either smoke child as of 2026-08-18. This is the one
  remaining unverified-live piece of EPIC 4; everything else is built.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper
  (Foundation/Higher window, always-fills fallback) via `lib/engine/mock-paper.ts`
  (F9, 2026-08-09); mark-weighted scoring + approximate boundary grade surfaced
  parent-only (F7, shipped 2026-08-14/18); calm countdown timer confirmed already
  live (2026-08-18 second pass, no new work needed).

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on both sides now). Spaced-rep warm-up + readiness
trajectory schedule deterministically from certification dates/scores (non-profiling).
- Next step: nothing new identified this run — the parent-facing review-debt line
  in the weekly digest (the last named gap) shipped 2026-08-09 and was
  re-confirmed still live 2026-08-18. Keep re-verifying each run rather than
  re-proposing; if a genuinely new gap appears, log it here.
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); the spacing curve widens — a correct recall doubles the interval
  (capped 90 days), an incorrect one resets to 7 (`spaced-repetition.ts`, verified
  2026-08-09). Warm-up re-verified live end-to-end 2026-08-14 (2 due for Ivy).
  `buildReviewDueLine` in the weekly digest confirmed shipped + correct 2026-08-18.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Rich motion already exists
(mcq settle, star burst, confetti, phase bar, week strip, mascot mood).
- Next step: `tap_reveal` and `drag_drop` are the last two interaction types with
  no dedicated wrong-answer settle motion (only a static dim) — proposed
  2026-08-18 second pass (Scout F11), reusing the exact `fill_blank` pattern
  (`wrongAttemptCount` + `useAnimationControls` breathe). Once that ships, EVERY
  interaction type will have both a correct settle AND a wrong settle — a natural
  point to retire this as a "next un-celebrated moment" hunt and reframe the next
  slice (e.g. celebration variety, streak flourishes) if the owner wants more.
- Done so far: every interaction type has its own correct-answer settle (tap_reveal
  + drag_drop accent sweep + drawn check, F11 2026-08-09); warm hint-card entrance +
  calm See-it beckon on a miss (F6 2026-08-09); calm guiding glow on reveal-after-a-miss
  + supportive fill_blank wrong-settle (F5+F6 2026-08-11, shipped 2026-08-12); a
  one-shot settle pulse on phase-bar segment activation (F7 2026-08-18, shipped).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. Next 16 + framer-motion→motion + several majors are GA.
- Next step: evaluate + stage Next.js 16, then the motion/lucide/tailwind-merge/
  eslint-10 majors, and keep the in-range drift fresh. Pair the nonce-based CSP
  hardening with the Next 16 move. Full staged migration plan (order, risks,
  Turbopack vs. our two webpack-only config hooks) researched and written up in
  `automation/memory.md`'s 2026-08-18 run log (Scout F8) — no live bump yet, per
  the owner's guidance (no staging environment on this repo).
- Done so far: hero LCP fix + LazyMotion below-fold split + ReducedMotionProvider on
  marketing/dashboard/child layouts + hero parallax reduced-motion gate (shipped
  2026-08-12/15); `@next/bundle-analyzer` added + used to kill an entire eager
  lucide-react barrel-import chunk on `/how-it-works` (First Load JS 379kB→211kB,
  F6 2026-08-18); audit stays at 0 vulnerabilities (re-confirmed 2026-08-18).

## EPIC 8 (new) — Mobile layout regressions: sweep the bare `grid` pattern
Status: NEW, opened 2026-08-18 (second pass). A deep mobile DOM audit (not just a
`scrollWidth` spot-check) found the FIRST 390px overflow in ~15 prior runs: a
child-hub resume card blew past the viewport because its wrapper used a bare
`grid gap-N` (no explicit `grid-cols-N`, so no `minmax(0,1fr)` protection) around
a `truncate`d long-text child (`resume-card.tsx`, Scout B2). The same bare-`grid`
pattern exists on `quest-cards.tsx` (hasn't overflowed yet — short text) and is
worth a quick project-wide grep once B2 ships, to check for other `className=
"...grid ..."` wrappers (no `grid-cols-N`) holding a `truncate`/`nowrap` text
child, so this class of bug doesn't reappear one card at a time.
- Next step: after B2 ships, grep `grid gap-` (bare, no `grid-cols`) across
  `src/components/child/**` and `src/app/(child)/**` and defensively add
  `min-w-0` to any grid item wrapping variable-length text.
- Done so far: root-caused + fix verified live for the resume card (B2,
  2026-08-18 second pass).
