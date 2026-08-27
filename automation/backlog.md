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
  no check on the actual question shape) has now produced FOUR distinct real bugs
  across math-visual.ts, teaching-animations.ts, english-visual.ts, and (2026-08-27)
  science-visual.ts.
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
  that day) — fixed + shipped 2026-08-24, re-confirmed the pattern holds.
- 2026-08-23 (Mechanic, post-B2 targeted check): grepped every deriver file under
  `src/lib/child/` for the same shape (regex/keyword match over raw prompt text
  with no anchor to a structured field). `math-visual.ts`'s numeric derivers are
  lower risk, since they require an actual digit/operator shape rather than a
  bare keyword, and already got a boundary-guard fix for B1. The next real
  candidate for this class is `science-visual.ts`: the `food_chain`,
  `life_cycle`, `states_of_matter` and `material_property` branches keyword
  sniff the raw prompt (e.g. "predator", "melt", "bendy") gated only on the
  topic being any `sci_*` topic, unlike the `cell`/`plant_parts` branches a few
  lines below them, which additionally require `topicTag.includes("cell"` or
  `"living")`. Not reproduced live yet (undetermined risk, no colliding prompt
  found in the seed bank so far) — still worth a dedicated audit pass or a
  defensive guard someday, but not re-flagged every run without new evidence.
- 2026-08-26 (Scout): re-derived the two questions certified this run
  ("5x + 2 − 3x" retested via warm-resume — confirmed still NO wrong figure,
  live-reconfirming the 2026-08-22 fix a third time) — no new correctness bugs
  found in the seed text itself this run. The day's real find (mock questions
  silently losing their `interaction` content) is a NEW, DIFFERENT surface from
  this epic's derived-visual class — tracked as its own EPIC 12, not folded in
  here, since the root cause (a data-shape mismatch between the mock builder and
  the interactive-question schema) is unrelated to the regex/keyword deriver
  pattern this epic tracks.
- 2026-08-27 (Scout): the 2026-08-23 "undetermined risk" prediction above came
  true — `deriveScienceVisual`'s `states_of_matter` branch (unconditional bare
  `"gas"` keyword match, no topic gate) live-reproduced on `sci_body`'s "Where
  does gas exchange happen in the lungs?" (a wrong Solid/Liquid/Gas particle
  diagram next to a human-biology question), and by source is confirmed to ALSO
  fire on `sci_reactions` ("What gas is produced when an acid reacts with a
  metal?") and `sci_ecology` ("Which gas do plants remove... during
  photosynthesis?"). Filed as B1. Fix proposed: drop the two bare `"gas"`
  needles (every other needle in that branch — solid/liquid/ice/freeze/melt/
  steam/evaporat/condens — never collided in a bank-wide grep). Also proposed
  F5: give `sci_body` its own correct derived visual (a simple lungs/heart
  sketch) as the natural companion to the fix, since today `sci_body` is the one
  major KS4 science topic with no dedicated branch at all.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-08-27 (after today's 2
  authored items land): eng_devices, maths_statistics, sci_electricity (pending),
  maths_sequences, maths_graphs, sci_cells, sci_atoms, eng_comprehension,
  eng_persuasive, sci_genetics, sci_ecology, eng_punctuation, eng_spelling,
  eng_poetry, eng_shakespeare, eng_creative — still a long tail, pick 1-2 per run.
  `maths_fractions`, `maths_number`, `maths_geometry` and (pending today's F3)
  `maths_pythagoras` and `sci_electricity` (pending today's F4) are now past this
  bar (each has >= 2 distinct command-word items after today's authoring lands).
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
  "Calculate") — SHIPPED + seeded 2026-08-22. maths_quadratics (factorising
  "Solve") authored 2026-08-23 and SHIPPED 2026-08-24; the paired sci_energy
  item was BLOCKED as a near-duplicate of an already-shipped 2026-08-18 item
  (same mass/speed/answer) — flagged for the owner to re-author with different
  numbers if still wanted. 2 MORE authored 2026-08-26 (Scout F2/F3): maths_fractions
  (VAT "Calculate", a forward-percentage-increase companion to the existing
  reverse-percentage item) and maths_number (small-decimal standard form "Write",
  the negative-power-of-10 companion to the existing multiplication item) —
  SHIPPED 2026-08-26. Also 3 maths_geometry MASTERY-POOL BROADENING items
  authored + SHIPPED 2026-08-26 (F1) — see EPIC 2's "variety" note below. 2 MORE
  authored 2026-08-27 (Scout F3/F4): maths_pythagoras (trig "Calculate the
  angle", a companion to the existing Pythagoras-only hypotenuse item) and
  sci_electricity (P = VI "Calculate the power", a companion to the existing
  V = IR item) — pending Mechanic transcription + seed.
- VARIETY axis (2026-08-23, unblocked + SHIPPED 2026-08-26): command-word
  COVERAGE and question-bank VARIETY are different axes — maths_geometry had its
  2nd command-word item, but its small mastery pool served near-duplicate
  phrasings of the same fact ("hexagon interior angle") across separate mastery
  attempts, LIVE-REPRODUCED TWICE (2026-08-23, 2026-08-26). Three new mastery
  items shipped 2026-08-26 (exterior angle of a regular polygon, angles on a
  straight line, angles in a parallelogram) to give the pool real variety. Keep
  watching other topics under active spaced review (EPIC 5) for the same
  thin-pool symptom — none newly found 2026-08-27.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. `maths_transformations` (Edexcel 1MA1 G7) confirmed 2026-08-27 to
have ZERO coverage anywhere in the bank (not thin — totally absent); a full topic
entry + worked example + 3 checked starters authored this run (F1, pending
Mechanic transcription + seed). Simultaneous equations and probability trees
(Maths) and required-practical recall / key equations (Science) and
extract-based language analysis (English) remain unscoped thin areas.
- Next step: seed `maths_transformations` (2026-08-27 F1), then tackle
  simultaneous equations next (Edexcel 1MA1 A19) the same way
  maths_inequalities/maths_mensuration/maths_transformations were each added: a
  topic entry + worked example + a small starter set.
- Done so far: `maths_mensuration` strand added + 3 checked starters seeded; mock
  unlock made a reachable count-driven floor (`lib/engine/mock-gate.ts`) so adding
  topics can't break the mock (F8, 2026-08-09). Inequalities strand authored
  (2026-08-09 Scout F2), pending Mechanic seed + worked example. Confirmed live
  2026-08-20: Maths now has 12 GCSE topics on the child roadmap (inequalities
  included) and the mock gate correctly stayed at a reachable 10/10, not 12/12.
  2026-08-27: `maths_transformations` authored (topic entry + worked example + 3
  starter questions) closing the Edexcel 1MA1 G7 zero-coverage gap — pending seed.

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE. A real gentle countdown timer, marks/boundary-grade work, the
exam-boundary-grade reveal card, AND (as of 2026-08-26) full question content for
`fill_blank` items pulled into a mock (EPIC 12) are ALL confirmed shipped and
working live. Do not re-propose a mock timer, the boundary-grade card, or the
fill_blank mock-content fix.
- Next step: nothing new identified this run specific to the mock itself — mock
  was correctly, honestly locked this run ("You've done your Maths mock for this
  week... next one unlocks on 31 August"), confirming the once-per-period rule
  holds under a second consecutive day's check. Keep re-verifying rather than
  re-proposing; EPIC 12 (mock question content) is the epic to extend if a future
  run finds another interaction type with the same generic-wrapper-prompt trap.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper via
  `lib/engine/mock-paper.ts` (F9, 2026-08-09); mark-weighted scoring + approximate
  boundary grade surfaced to the CHILD via a warm, non-pass/fail "is at a grade X
  level today" reveal (F7, shipped 2026-08-14/18); calm countdown timer confirmed
  already live (2026-08-18 second pass). 2026-08-26: full Maths mock end-to-end
  through the boundary-grade reveal, closing the epic's last-unverified-live
  piece; EPIC 12's fill_blank mock-content bug (found the same day) SHIPPED and
  re-verified via a read-only DB check the same day.

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on both sides now). Spaced-rep warm-up + readiness
trajectory schedule deterministically from certification dates/scores (non-profiling).
- Next step: nothing new identified this run — the parent-facing review-debt line
  in the weekly digest (the last named gap) shipped 2026-08-09 and was
  re-confirmed still live 2026-08-18. Keep re-verifying each run rather than
  re-proposing; if a genuinely new gap appears, log it here. NOTE (2026-08-27):
  EPIC 13's `certified_at` bug, if unfixed, would also corrupt the readiness
  trajectory chart's certification-over-time series (a re-mastered topic would
  appear to certify again on today's date) — tracked under EPIC 13, not here,
  since the root cause is a data-write bug, not a scheduling-logic gap.
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); the spacing curve widens — a correct recall doubles the interval
  (capped 90 days), an incorrect one resets to 7 (`spaced-repetition.ts`, verified
  2026-08-09). Warm-up re-verified live end-to-end 2026-08-14, 2026-08-19, 2026-08-26
  and again 2026-08-27 (mixed-subject warm-up: arithmetic correct, punctuation
  wrong with a calm nudge, materials correct — all three subjects interleaved in
  one 3-question warm-up). `buildReviewDueLine` in the weekly digest confirmed
  shipped + correct 2026-08-18.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Every interaction type
(mcq, fill_blank, tap_reveal, drag_drop) now has BOTH a correct settle and a
wrong settle (F11, shipped 2026-08-18) — that milestone is complete. The
mock-exam answer-pick pulse (F4, 2026-08-26) is also SHIPPED — do not re-propose.
- Next step: F6 (2026-08-27) is a small remaining consistency gap — the "Today I
  learned" reflection confirmation line has no entrance animation while its
  sibling mood-check-in confirmation does (`animate-child-pop`); a matching
  fade/slide-in would close the last inconsistency between these two very
  similar "you just told me something" moments.
- Done so far: every interaction type has its own correct-answer settle
  (tap_reveal + drag_drop accent sweep + drawn check, 2026-08-09); warm hint-card
  entrance + calm See-it beckon on a miss (2026-08-09); calm guiding glow on
  reveal-after-a-miss + supportive fill_blank wrong-settle (2026-08-11/12); a
  one-shot settle pulse on phase-bar segment activation (2026-08-18); tap_reveal
  and drag_drop wrong-answer settle motion (F11, shipped + live-verified
  2026-08-18); drag_drop chip pick-up lift + a real reactive Eddie face on the
  practice correct/wrong panel (F5/F7, shipped 2026-08-19); the See-it panel now
  fully collapses after a correct mastery answer (B5, shipped + re-verified live
  2026-08-23, 2026-08-26 and again 2026-08-27 on a fresh English practice
  question); tap_reveal's reveal/select gesture split with a "Tap again to
  choose this" affordance (B4, shipped + re-verified live 2026-08-23, 2026-08-26
  and 2026-08-27); Eddie now appears on the mastery reteach screen (F4/2026-08-23,
  shipped 2026-08-24, re-verified live 2026-08-26 and 2026-08-27); the mock-exam
  pick pulse (F4, 2026-08-26) SHIPPED (gate-verified only that day; still not
  live-driven as a real mock was locked every check since — not a bug, just a
  once-per-week quota timing constraint).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; `tailwind-merge` and
`lucide-react` are now ALSO current (shipped 2026-08-24). Next.js, the
framer-motion→motion rename, and eslint 10 remain a further major behind.
- Next step: eslint 10 is BLOCKED, not independent as originally scoped —
  `eslint-config-next@15.5.23`'s own peerDependencies cap at `eslint: "^9.0.0"`,
  so eslint can't move until the Next.js major it ships alongside (16) is
  adopted (confirmed 2026-08-24). Remaining staged order: Next.js 15→16 as its
  own dedicated pass (read the official upgrade guide first — this repo relies
  on specific caching/route-group behaviour), THEN eslint 10 and the
  framer-motion→motion rename can follow. Pair the nonce-based CSP hardening
  with the Next 16 move (current CSP uses `'unsafe-inline'` for script-src,
  reconfirmed live 2026-08-26 via `curl -IL` — still correctly blocks arbitrary
  third-party script origins, but a nonce would be stricter still). SEPARATELY
  (2026-08-27): several dependencies have a newer version already within the
  DECLARED semver range (`npm outdated`'s "Wanted" column) — `mongodb`, `stripe`,
  `jose`, `@sentry/nextjs`, `@upstash/redis`, `@axe-core/playwright`, `tsx`,
  `vitest` — routine `npm update` hygiene, NOT part of the Next 16 staged
  migration; filed as F7, 2026-08-27, safe to do independently and immediately.
- Done so far: hero LCP fix + LazyMotion below-fold split + ReducedMotionProvider
  on marketing/dashboard/child layouts + hero parallax reduced-motion gate
  (shipped 2026-08-12/15); `@next/bundle-analyzer` added + used to kill an eager
  lucide-react barrel-import chunk on `/how-it-works` (F6 2026-08-18); audit
  stays at 0 vulnerabilities (re-confirmed 2026-08-26 and 2026-08-27, `npm audit`
  both prod-only and full tree). `@axe-core/playwright` is wired into a real CI
  a11y job (shipped 2026-08-19). `tailwind-merge` v2→v3 and `lucide-react` v0→v1
  both shipped 2026-08-24 (zero code changes needed for either bump).

## EPIC 8 — Mobile layout regressions: sweep the bare `grid` pattern
Status: RETIRED as an active risk 2026-08-19. B2's fix (2026-08-18) was
re-verified live and correct. Re-confirmed clean again 2026-08-20, 2026-08-23,
2026-08-26 and 2026-08-27 (mobile 390px pass across the hub, a resumed
`fill_blank` lesson and a `drag_drop` question, `scrollWidth` 380 on every screen
checked). Re-open only if a future run finds a concrete overflow repro, don't
re-sweep speculatively.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19, now present at every scoped call site,
including the two 2026-08-23 gaps (Topic-mastered sizing + reteach-screen
presence), BOTH shipped 2026-08-24 and re-verified live 2026-08-26 and 2026-08-27.
`EddieAvatar` (self-hosted SVG/CSS, no Lottie/CDN, mood-driven off signals
already computed) is live on the practice-player correct/wrong panel, the See-it
coach, my-stuff voice preview, the Topic-mastered completion screen, AND the
mastery reteach screen.
- Next step: nothing new identified this run — 2026-08-26/27 both confirmed the
  scale-125 Eddie on Topic-mastered reads as a genuine, visible co-star beside
  the trophy on live screenshots at desktop; no further sizing work needed unless
  a future run finds it still too subtle at mobile widths specifically (not
  separately re-checked this run either).
- Done so far: v1 on the practice-player panel (2026-08-19); See-it coach +
  my-stuff voice preview (2026-08-20); Topic-mastered completion screen
  celebrating/encouraging moods (F3, shipped 2026-08-22); Eddie sized up on
  Topic-mastered (F5) + added to the reteach screen (F4), both shipped
  2026-08-24 and re-confirmed live 2026-08-26 and 2026-08-27 across fresh
  certifications and a deliberately-failed mastery attempt each time.

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Per-page canonical/openGraph/
twitter metadata across all ~19 marketing pages (B1) and the robots.ts/
sitemap.ts fixes (B2) both shipped and live-verified 2026-08-20. Keep as a
standing every-run spot-check (cheap to re-confirm via a curl) rather than an
active work item; re-open only if a future run finds a concrete regression.

## EPIC 11 — Dashboard "today" surface conflates weekday-empty with plan-absent
Status: SHIPPED 2026-08-24, RE-VERIFIED LIVE 2026-08-26 AND 2026-08-27 (a second,
independent approve-then-reload: approved a fresh Sam Smoke week this run, and the
dashboard card immediately switched from "Sam doesn't have a plan yet" to showing
the real linked topic — the fix holds consistently across different children and
different runs). No further action; re-open only on a concrete regression.

## EPIC 12 — Mock-exam questions must carry their FULL content, not just `prompt`/`options`
Status: SHIPPED 2026-08-26, RE-VERIFIED 2026-08-26 (Mechanic build pass, same day).
`buildMockPaper` now synthesises a self-contained mock prompt for `fill_blank`
items via `mockDisplayPrompt()`; live/DB-verified the exact repro question
("2x + 3 = 11, so x = ___") now shows its full equation in the mock. No further
action; re-open only if a future run finds another interaction type
(`tap_reveal`/`drag_drop`) with the same generic-wrapper-prompt trap in a live mock.
- Done so far: fix shipped + verified. Broader spot-check (every non-mcq question
  in every subject's mock actually reads as complete) not yet done as a dedicated
  pass — worth a future run once a mock naturally unlocks for a subject with a
  `tap_reveal`/`drag_drop` item in its practice/mastery pool.

## EPIC 13 (new) — `certified_at` must not move on a re-mastery of an already-certified topic
Status: NEW, opened 2026-08-27. `upsertCompetence` (`src/lib/db/repo.ts:1534-1564`)
unconditionally sets `certified_at: new Date()` on every write with
`state === "certified"`, with NO check for whether the topic was already
certified. The function's OWN comment says a re-run "must not reset its review
schedule" and correctly guards `next_review_at`/`review_interval_days` against
exactly that — but the identical guard was never applied to `certified_at`
itself. `certified_at` feeds the LA portfolio's "Awarded {date}" evidence line,
the parent dashboard's "X topics certified this week" stat, and the readiness
trajectory chart — all four would silently show today's date for a topic
mastered weeks ago if a child ever revisits it via "Practice more" and gets a
perfect mastery re-take (confirmed reachable: Scout navigated exactly this path
this run on two already-certified topics, though did not complete the final
mastery re-take live to avoid corrupting real test-family certification dates).
Filed as B2, 2026-08-27 (fix + evidence in `automation/findings/2026-08-27.md`).
- Next step: ship B2's fix (reuse the same "was it already certified?" check the
  review-schedule guard already performs, and skip re-setting `certified_at` when
  it was), then live-verify via a READ-ONLY DB check (compare a topic's
  `certified_at` before/after a deliberate re-take) rather than a fresh live
  re-take against real data.
- Done so far: nothing shipped yet — fresh epic opened from today's code-audit
  finding (Part C bug-hunter pass, not the Playwright UI walk).
