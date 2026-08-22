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
Status: ACTIVE. The existing bank (~160+ human-authored items across 5 seed files)
is arithmetically/factually clean (re-audited 2026-08-08, 08-09, and again the 17
EXAM_STYLE_QUESTIONS on 2026-08-14).
- Next step: continue a rolling per-subject correctness re-audit each run; note
  that a "retire" of a seed question must delete the orphaned old doc (seed never
  deletes), not just reword the prompt. The DERIVED VISUALS built from a question's
  prompt string remain a separate correctness surface from the seed text itself —
  2026-08-22 found two (B1/B2, both fixed+shipped); 2026-08-23 found a THIRD, same
  class: an English `letter_tiles` visual firing on the first quoted word of a
  multi-word-list prompt with no relation to the question being asked (see today's
  B2). Keep spot-checking a derived figure against its own question every run —
  this deriver-chain class of bug (shallow regex/keyword match on raw prompt text,
  no check on the actual question shape) has now produced three distinct real bugs
  across math-visual.ts, teaching-animations.ts and english-visual.ts.
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); B3 sci_body water-absorption item retired + reworded + orphan
  deleted (2026-08-09); curriculum.seed.extra.ts + the F7 exam-style items + F8
  mensuration re-derived clean (2026-08-09); all 17 EXAM_STYLE_QUESTIONS
  re-derived clean again (2026-08-14 Scout) — no correctness bugs. Spot-checked
  the existing eng_creative/eng_poetry/eng_shakespeare seeded diagnostic/practice
  items 2026-08-20 while authoring their first command-word items (EPIC 2) — all
  correct-answer indices match their explanations, no ambiguity found. 2026-08-22:
  seed TEXT re-confirmed clean, but found TWO derived-visual correctness bugs
  (not in the seed data itself, but in the deterministic figure/animation deriver
  chain that reads the prompt string): B1 a number-line figure showing false
  arithmetic for a "5x + 2 − 3x" collect-like-terms question
  (lib/child/math-visual.ts's deriveNumberLine grabbing a stray "2 − 3"
  substring), and B2 a Science "See the process" template rendering on an
  English alliteration question because the prompt contains the word "sound"
  (lib/child/teaching-animations.ts's deriveScience keyword regex). Both fixed +
  shipped 2026-08-22 (regex boundary guard + subject-gate) — live-reconfirmed
  2026-08-23 that the "5x + 2 − 3x" prompt no longer shows any wrong figure at
  all (falls through to no figure, exactly as intended). 2026-08-23 found a THIRD
  of the same class in `english-visual.ts`'s `letter_tiles` deriver (filed as B2
  today) — fix proposed is the same "add a guard, don't special-case the one
  string" pattern as the first two.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-08-23: maths_fractions,
  maths_number, eng_devices, maths_algebra_linear, maths_pythagoras,
  maths_statistics, sci_electricity, maths_sequences, maths_geometry,
  maths_graphs, sci_cells, sci_atoms, eng_comprehension, eng_persuasive,
  sci_states, eng_grammar, sci_genetics, sci_ecology, eng_punctuation,
  eng_spelling, eng_poetry, eng_shakespeare, eng_creative — still a long tail,
  pick 1-2 per run. SEPARATE NEW ANGLE (2026-08-23): command-word COVERAGE and
  question-bank VARIETY are different axes — maths_geometry has its 2nd
  command-word item, but its small mastery pool still serves near-duplicate
  phrasings of the same fact ("hexagon interior angle") across separate mastery
  attempts on the same topic. Once a topic has its command-word depth, the next
  useful move is broadening its overall mastery pool so repeat attempts and
  future spaced-review sessions (EPIC 5) don't feel repetitive.
- Done so far: 6 spec-mapped exam-style questions (F7, 2026-08-09) across
  maths_fractions/ratio/number, sci_forces/reactions, eng_devices; 5 MORE authored
  2026-08-09 (Scout F1) for maths_algebra_linear, maths_pythagoras,
  maths_statistics, sci_electricity, eng_analysis. 6 MORE 2026-08-11 (Scout F3+F4):
  maths_sequences, maths_geometry, maths_graphs, sci_forces (acceleration),
  sci_reactions (Mr), eng_analysis (metaphor). 3 MORE authored 2026-08-14 (Scout
  F1/F2/F3): sci_cells, sci_body, maths_quadratics — SHIPPED 2026-08-18. 4 MORE
  authored 2026-08-18 first pass: sci_atoms, sci_energy, eng_comprehension,
  eng_persuasive — SHIPPED same day. 2 MORE authored 2026-08-18 second pass
  (F9/F10): sci_states, eng_grammar — SHIPPED. 4 MORE authored 2026-08-19
  (Scout F1-F4): sci_genetics (Punnett-square probability, AQA 8464 4.6),
  sci_ecology (percentage energy transfer, AQA 8464 4.7), eng_punctuation
  (it's/its), eng_spelling (their/there/they're) — SHIPPED (confirmed live in
  the Vercel deployment history 2026-08-20). 2 MORE authored 2026-08-22 (Scout
  F1/F2): maths_ratio (direct-proportion "Calculate") and sci_body (heart-rate
  "Calculate") — SHIPPED + seeded 2026-08-22. 2 MORE authored 2026-08-23 (Scout
  F1/F2): maths_quadratics (factorising "Solve") and sci_energy (kinetic energy
  "Calculate") — pending Mechanic transcription + seed.

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
  (2026-08-09 Scout F2), pending Mechanic seed + worked example. Confirmed live
  2026-08-20: Maths now has 12 GCSE topics on the child roadmap (inequalities
  included) and the mock gate correctly stayed at a reachable 10/10, not 12/12.

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE, further along than previously tracked. A real gentle countdown
timer AND the marks/boundary-grade work are BOTH already shipped and calm. Do not
re-propose a mock timer.
- Next step: live-drive the F7 (2026-08-14) exam-boundary-grade card once a test
  child crosses the reachable mock-unlock floor (10 certified topics per subject)
  — still not reached by any smoke child as of 2026-08-23 (Ivy, the furthest
  along, is at 8/10 Maths, 5/10 English, 6/10 Science after this run's fresh
  certifications; mock hub re-confirmed honestly locked live). This is the one
  remaining unverified-live piece of EPIC 4; everything else is built.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper via
  `lib/engine/mock-paper.ts` (F9, 2026-08-09); mark-weighted scoring + approximate
  boundary grade surfaced parent-only (F7, shipped 2026-08-14/18); calm countdown
  timer confirmed already live (2026-08-18 second pass, no new work needed).

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on both sides now). Spaced-rep warm-up + readiness
trajectory schedule deterministically from certification dates/scores (non-profiling).
- Next step: nothing new identified this run — the parent-facing review-debt line
  in the weekly digest (the last named gap) shipped 2026-08-09 and was
  re-confirmed still live 2026-08-18. Keep re-verifying each run rather than
  re-proposing; if a genuinely new gap appears, log it here. (See EPIC 2's new
  "variety" angle — a thin mastery pool on a topic under active spaced review
  is the concrete way this epic could regress; watch for it.)
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); the spacing curve widens — a correct recall doubles the interval
  (capped 90 days), an incorrect one resets to 7 (`spaced-repetition.ts`, verified
  2026-08-09). Warm-up re-verified live end-to-end 2026-08-14 and again 2026-08-19
  (interleaved a Science review into an otherwise-English warm-up session for Ivy).
  `buildReviewDueLine` in the weekly digest confirmed shipped + correct 2026-08-18.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Every interaction type
(mcq, fill_blank, tap_reveal, drag_drop) now has BOTH a correct settle and a
wrong settle (F11, shipped 2026-08-18) — that milestone is complete.
- Next step: the See-it-panel-collapse gap (F7/2026-08-20, B5/2026-08-22) is now
  SHIPPED and live-reconfirmed 2026-08-23 (opened See-it on a wrong-twice
  maths_geometry question, answered correctly — the whole panel collapsed back
  to a bare "See it" button, not just the inner widget). NEW gap found
  2026-08-23: the mastery "reteach" screen (shown when an attempt scores below
  the pass threshold, sending the child back for "Try a fresh check") has NO
  Eddie at all — just a static lightbulb icon — the one lesson-ending state
  that currently gets zero mascot warmth (proposed as F4, 2026-08-23).
- Done so far: every interaction type has its own correct-answer settle
  (tap_reveal + drag_drop accent sweep + drawn check, 2026-08-09); warm hint-card
  entrance + calm See-it beckon on a miss (2026-08-09); calm guiding glow on
  reveal-after-a-miss + supportive fill_blank wrong-settle (2026-08-11/12); a
  one-shot settle pulse on phase-bar segment activation (2026-08-18); tap_reveal
  and drag_drop wrong-answer settle motion (F11, shipped + live-verified
  2026-08-18); drag_drop chip pick-up lift + a real reactive Eddie face on the
  practice correct/wrong panel (F5/F7, shipped 2026-08-19); the See-it panel now
  fully collapses after a correct mastery answer (B5, shipped + re-verified live
  2026-08-23); tap_reveal's reveal/select gesture split with a "Tap again to
  choose this" affordance (B4, shipped + re-verified live 2026-08-23).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; Next.js, the
framer-motion→motion rename, lucide-react and tailwind-merge have each drifted a
further major behind since last checked.
- Next step: 2026-08-23 re-measured the exact gaps: `next@15.5.23` installed vs
  `16.3.2` latest (Next 16 needs Node >=20.9.0, already satisfied here);
  `framer-motion@11.18.2` vs the renamed `motion@13.1.1` (package rename PLUS two
  majors); `lucide-react@0.469.0` vs `1.33.0`; `tailwind-merge@2.6.1` vs `3.6.0`;
  `eslint@9.39.5` vs `10.9.0`. Proposed staging order (lowest→highest risk):
  tailwind-merge → lucide-react → eslint 10 → framer-motion→motion → Next.js 16,
  each its own gated commit, per F6 (2026-08-23). Pair the nonce-based CSP
  hardening with the Next 16 move (current CSP uses `'unsafe-inline'` for
  script-src, confirmed live 2026-08-19 via `curl -I` — still correctly blocks
  arbitrary third-party script origins, but a nonce would be stricter still).
- Done so far: hero LCP fix + LazyMotion below-fold split + ReducedMotionProvider
  on marketing/dashboard/child layouts + hero parallax reduced-motion gate
  (shipped 2026-08-12/15); `@next/bundle-analyzer` added + used to kill an eager
  lucide-react barrel-import chunk on `/how-it-works` (F6 2026-08-18); audit
  stays at 0 vulnerabilities (re-confirmed 2026-08-23, `npm audit` both
  prod-only and full tree — zero highs/mediums/lows, not just zero highs).
  `@axe-core/playwright` is now wired into a real CI a11y job (shipped
  2026-08-19), closing that gap.

## EPIC 8 — Mobile layout regressions: sweep the bare `grid` pattern
Status: RETIRED as an active risk 2026-08-19. B2's fix (2026-08-18) was
re-verified live and correct. Re-confirmed clean again 2026-08-20 and 2026-08-23
(mobile 390px pass on marketing + child lesson, `scrollWidth` 380 on every page
checked). Re-open only if a future run finds a concrete overflow repro, don't
re-sweep speculatively. NOTE: 2026-08-23 found a DIFFERENT mobile-layout defect
that is NOT this pattern (a fixed-size Button's own label text clipping via
overflow-hidden, not a `grid`/overflow-width issue) — filed as its own B1, not
folded into this epic, since the root cause and fix are unrelated to the `grid`
sweep this epic tracked.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19, now present at every scoped call site.
`EddieAvatar` (self-hosted SVG/CSS, no Lottie/CDN, mood-driven off signals
already computed) is live on the practice-player correct/wrong panel, the See-it
coach, my-stuff voice preview, AND (as of 2026-08-22, re-verified live 2026-08-23)
the Topic-mastered completion screen's "celebrating"/"encouraging" moment.
- Next step: two small polish gaps found 2026-08-23 — (1) on Topic-mastered,
  Eddie is visually too subtle next to the much larger trophy circle (easy to
  miss at a glance) — propose sizing it up or sequencing its entrance after the
  confetti for this call site specifically (F5, 2026-08-23); (2) the mastery
  "reteach" screen (attempt scored below threshold, sent back to retry) has NO
  Eddie at all, the one lesson-ending state with zero mascot warmth (F4,
  2026-08-23).
- Done so far: v1 on the practice-player panel (2026-08-19); See-it coach +
  my-stuff voice preview (2026-08-20); Topic-mastered completion screen
  celebrating/encouraging moods (F3, shipped 2026-08-22, re-verified live
  2026-08-23 across three separate certifications).

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Per-page canonical/openGraph/
twitter metadata across all ~19 marketing pages (B1) and the robots.ts/
sitemap.ts fixes (B2) both shipped and live-verified 2026-08-20. Keep as a
standing every-run spot-check (cheap to re-confirm via a curl) rather than an
active work item; re-open only if a future run finds a concrete regression.

## EPIC 11 (new) — Dashboard "today" surface conflates weekday-empty with plan-absent
Status: NEW, opened 2026-08-23. `TodayCard`'s empty state ("doesn't have a plan
yet — set up this week") fires whenever today's weekday has zero schedule items,
which is also true on any day an APPROVED plan simply has nothing scheduled (e.g.
a Mon-Fri-only week on a Saturday/Sunday) — live-reproduced this run with Ivy's
fully-approved current week. Filed as B3, 2026-08-23.
- Next step: ship B3's fix (thread an `hasApprovedWeek` signal alongside
  `quests` so the empty state can tell "no plan at all" apart from "nothing
  scheduled today"), then re-verify on a weekend day that the copy no longer
  offers to regenerate an already-approved week.
- Done so far: nothing shipped yet — this is a fresh epic opened from today's
  finding.
