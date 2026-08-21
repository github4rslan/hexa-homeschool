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
  deletes), not just reword the prompt. NEW ANGLE (2026-08-22): the seed TEXT is
  clean, but the DERIVED VISUALS built from a question's prompt string are a
  separate correctness surface that needs its own audit — a keyword-sniffing or
  loosely-bounded regex deriver can silently attach a wrong-subject or wrong-maths
  figure to a perfectly correct question. Worth spot-checking a derived figure
  against its own question, not just assuming the deriver chain is safe because
  the answer text is.
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
  (lib/child/teaching-animations.ts's deriveScience keyword regex). Both
  filed for Mechanic; fix is a regex boundary guard (B1) and a subject-gate (B2).

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), very close to closing. Every Science topic and 9 of
10 English topics now have >= 1 command-word item (sci_genetics/sci_ecology/
eng_punctuation/eng_spelling all confirmed SHIPPED in the Vercel deployment
history as of 2026-08-20).
- Next step: zero-coverage is CLOSED — every KS4 topic across all three
  subjects has at least one command-word item (confirmed shipped 2026-08-20).
  The active slice is now depth (>= 2 per topic). 2026-08-22 (Scout F1/F2)
  authored the first two depth items: a second maths_ratio item ("Calculate"
  direct-proportion) and a second sci_body item ("Calculate" heart-rate) —
  both topics had exactly one command-word item before. Keep picking
  single-coverage topics each run rather than re-sweeping the whole bank.
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
  the Vercel deployment history 2026-08-20).

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
  — still not reached by either smoke child as of 2026-08-20 (Ivy is at 6/10
  Maths, 3/10 English, 6/10 Science; mock hub re-confirmed honestly locked live).
  This is the one remaining unverified-live piece of EPIC 4; everything else is
  built.
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
  re-proposing; if a genuinely new gap appears, log it here.
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
- Next step: a small polish gap found live 2026-08-20 — after a correct mastery
  answer that followed a "See it" open, the See-it panel's own "Your turn" tap
  widget stays live underneath the celebration instead of settling, so two calls
  to action compete at the exact moment that should feel like a clean win
  (proposed as F7 2026-08-20 in that day's findings).
- Done so far: every interaction type has its own correct-answer settle
  (tap_reveal + drag_drop accent sweep + drawn check, 2026-08-09); warm hint-card
  entrance + calm See-it beckon on a miss (2026-08-09); calm guiding glow on
  reveal-after-a-miss + supportive fill_blank wrong-settle (2026-08-11/12); a
  one-shot settle pulse on phase-bar segment activation (2026-08-18); tap_reveal
  and drag_drop wrong-answer settle motion (F11, shipped + live-verified
  2026-08-18); drag_drop chip pick-up lift + a real reactive Eddie face on the
  practice correct/wrong panel (F5/F7, shipped 2026-08-19) — both re-verified
  live 2026-08-20 during a full tap_reveal + mcq lesson drive (Cell Biology).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. Next 16 + framer-motion→motion + several majors are GA.
- Next step: evaluate + stage Next.js 16, then the motion/lucide/tailwind-merge/
  eslint-10 majors, and keep the in-range drift fresh. Pair the nonce-based CSP
  hardening with the Next 16 move (current CSP uses `'unsafe-inline'` for
  script-src, confirmed live 2026-08-19 via `curl -I` — still correctly blocks
  arbitrary third-party script origins, e.g. it blocked a CDN axe-core injection
  attempt this run, but a nonce would be stricter still). Full staged migration
  plan researched and written up in `automation/memory.md`'s 2026-08-18 run log.
- Done so far: hero LCP fix + LazyMotion below-fold split + ReducedMotionProvider
  on marketing/dashboard/child layouts + hero parallax reduced-motion gate
  (shipped 2026-08-12/15); `@next/bundle-analyzer` added + used to kill an eager
  lucide-react barrel-import chunk on `/how-it-works` (F6 2026-08-18); audit
  stays at 0 vulnerabilities (re-confirmed 2026-08-20, `npm audit` both
  prod-only and full tree). `@axe-core/playwright` is now wired into a real CI
  a11y job (shipped 2026-08-19), closing that gap.

## EPIC 8 — Mobile layout regressions: sweep the bare `grid` pattern
Status: RETIRED as an active risk 2026-08-19. B2's fix (2026-08-18) was
re-verified live and correct. Re-confirmed clean again 2026-08-20 (mobile 390px
pass on marketing + child lesson, `scrollWidth` 380 on every page checked).
Re-open only if a future run finds a concrete overflow repro, don't re-sweep
speculatively.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19. `EddieAvatar` (self-hosted SVG/CSS, no
Lottie/CDN, mood-driven off signals already computed) is live on the
practice-player correct/wrong panel — re-verified live 2026-08-20 on a real
Cell Biology lesson (warm-nod on a correct tap_reveal + mcq answer, encouraging
face on a wrong mcq answer, never inverted into a frown).
- Next step: the See-it coach + my-stuff voice-preview call sites (F5,
  2026-08-20) are SHIPPED and re-verified live. 2026-08-22 (Scout) found the
  NEXT gap: the "celebrating" mood (explicitly documented as "mastery: a bigger
  bounce + tilt flourish") is wired only into a tiny 1.3s in-lesson recall-success
  flash — the actual "Topic mastered!" completion screen (the biggest emotional
  payoff in the app, trophy + confetti, no Eddie at all) has never used it.
  Proposed as F3, 2026-08-22.
- Done so far: v1 on the practice-player panel (2026-08-19); See-it coach +
  my-stuff voice preview (2026-08-20).

## EPIC 10 (new) — SEO/metadata hygiene sitewide
Status: NEW, opened 2026-08-20. The B-seo checklist (now a standing every-run
lane) found a real, well-evidenced, sitewide gap: `alternates.canonical` and the
`openGraph`/`twitter` blocks are only ever set once, in the root layout, to the
HOMEPAGE's values — no marketing page overrides them, so every non-home page
(confirmed live on `/pricing` and `/gallery`) declares its own canonical URL as
the homepage and shows the homepage's title/description in a shared social-card
preview. Separately, `robots.ts` never learned about the (child)/(admin)/(tutor)
route groups or several (dashboard) sub-paths, and `sitemap.ts` has drifted out
of sync with the real page tree (missing `/gallery`, `/resources`).
- Next step: ship the per-page metadata helper (B1, 2026-08-20) across all ~19
  marketing pages, then the robots.ts/sitemap.ts fixes (B2, 2026-08-20). Both
  are mechanical, additive, low-risk — good candidates to ship together.
- Done so far: nothing shipped yet — this is a fresh epic opened from today's
  findings.
