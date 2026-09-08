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
Status: ACTIVE. The existing bank (~170+ human-authored items across 5 seed files)
is arithmetically/factually clean (re-audited 2026-08-08, 08-09, and again the 17
EXAM_STYLE_QUESTIONS on 2026-08-14).
- Next step: continue a rolling per-subject correctness re-audit each run; note
  that a "retire" of a seed question must delete the orphaned old doc (seed never
  deletes), not just reword the prompt. The DERIVED VISUALS/COPY built from a
  question's prompt string remain a separate correctness surface from the seed
  text itself — now NINE distinct real bugs of this shallow-regex/keyword-match-
  on-raw-prompt-text class across math-visual.ts, teaching-animations.ts,
  english-visual.ts (three times now), science-visual.ts (twice), and now
  animation-timeline.ts. Keep spot-checking a derived figure/copy line against
  its own question every run, and specifically watch for heuristics with an
  unguarded "else"/default branch or an overly-broad numeric-pattern fallback —
  that is its own named risk pattern (see the 2026-08-28 and 2026-09-08 notes).
  The 2026-08-30/08-31 negative-case-test standing next-step is now partly done
  (see the 2026-08-31 entry).
- Done so far: full re-derivation of all quantitative + factual answers
  (2026-08-08); B3 sci_body water-absorption item retired + reworded + orphan
  deleted (2026-08-09); curriculum.seed.extra.ts + the F7 exam-style items + F8
  mensuration re-derived clean (2026-08-09); all 17 EXAM_STYLE_QUESTIONS
  re-derived clean again (2026-08-14 Scout). 2026-08-22: seed TEXT re-confirmed
  clean, but found TWO derived-visual correctness bugs (number-line false
  arithmetic on a collect-like-terms question; a Science template rendering on an
  English alliteration question) — both fixed + shipped 2026-08-22. 2026-08-23
  found a THIRD of the same class in `english-visual.ts`'s `letter_tiles` deriver
  — fixed + shipped 2026-08-24. 2026-08-27 found a FOURTH (`states_of_matter`
  bare "gas" keyword match) — SHIPPED 2026-08-28. 2026-08-28 found a FIFTH, a
  NEW shape (an unguarded "else" default that always asserts something, even
  wrong) in `pluralRuleFor` (no irregular-plural exception list) — SHIPPED
  2026-08-28 (B1), re-verified live 2026-08-28 (no wrong figure on the "plural
  of child" mastery question any more). Also found + shipped a topic/grade-band
  placement leak (a quadratic-expansion question sitting in `maths_algebra_linear`
  instead of `maths_quadratics`) — SHIPPED 2026-08-28 (B3), re-verified live
  2026-08-29 (the `maths_algebra_linear` practice pool is now 5 items, none
  produce an x² term; `maths_quadratics`'s own item is untouched).
- 2026-08-29 (Scout): re-derived `maths_graphs`'s full 4-question GCSE-band pool
  (y-intercept identification, gradient-0 fact, point-on-line "find y", and the
  existing gradient-from-two-points "work out" item) — all correct, no
  ambiguity. Also spot-checked `sci_atoms`'s GCSE-band pool (4 questions across
  `curriculum.seed.ts` + `curriculum.seed.extra.ts`): all correct, but genuinely
  thin (4 items for a spec area covering atomic structure, isotopes, electronic
  configuration AND periodic table trends) — flagged here as a coverage gap for a
  future run to size up with 1-2 targeted new items (not authored today; today's
  authoring effort went to `maths_graphs`'s command-word gap instead, see EPIC 2).
- 2026-08-30 (Scout): ran a fresh authoritative pool-size audit (a temporary,
  never-committed script that imports the seed arrays directly — no live DB
  touch — correcting for the tuple-format under-count class). **CORRECTION: the
  2026-08-29 `sci_atoms` "thin (4 items)" note above was ITSELF a stale premise
  of the exact class it warns about** — the real pool is 10 questions (4
  mastery), not 4; drop `sci_atoms` from the thin-topics watchlist. The REAL
  thinnest topics today are `maths_mensuration` (3 total, tiers 2-3 only, no
  entry tier-1 or stretch tier-5), `maths_inequalities` (3 total, tiers 3-4
  only), `maths_transformations` (3 total, tiers 2-3 only) and
  `maths_simultaneous` (3 total, tiers 3-5) — all text-correct on re-derivation,
  purely a coverage/tier-range gap. Authored + filed one new tier-1
  `maths_mensuration` question (F1, 2026-08-30, perimeter of a rectangle,
  Edexcel 1MA1 G16) in full `SeedQuestion` shape, pending owner seed approval;
  the other three topics are scoped with exact tier gaps for a future run
  rather than all authored in one sitting. Also found a SIXTH derived-visual
  instance of the recurring class (B4, 2026-08-30): `english-visual.ts`'s
  `letter_tiles` fallback fires on ANY prompt with one quoted single word
  regardless of relevance — confirmed live showing "stabbed" spelled into
  letter tiles for a tone/connotation-EFFECT question (`eng_analysis`), where
  spelling the word out is pedagogically irrelevant noise, not wrong-but-
  irrelevant rather than factually wrong. SHIPPED 2026-08-31 (B4): excludes
  prompts using effect/analysis language (affects, effect, suggests, creates,
  tone, connotation, mood); falls back to the decorative AI image when in
  doubt, same pattern as the irregular-plurals guard.
- 2026-08-31 (Mechanic, F7): added curated negative-case test blocks to
  `math-visual.test.ts` and `science-visual.test.ts` (english-visual.ts's own
  negative cases landed with B4 above). While authoring science-visual.ts's
  negative cases, found and fixed a SEVENTH real instance of the same class:
  `material_property`'s "magnetic" needle had no topic gate at all, so a
  genuine electromagnetism prompt on `sci_electricity`/`sci_forces` ("a wire
  carrying a current creates a magnetic field") would have wrongly rendered a
  "does a magnet stick to this material?" test. Gated to
  `sci_ks2_materials`/`sci_states` only, mirroring the existing
  `states_of_matter` gate. No live seed question triggered this yet (checked
  via a temporary, never-committed script importing the seed arrays), so this
  was caught before shipping, exactly the point of the F7 negative-test pass.
  `deriveMathVisual` (math-visual.ts) still carries no topic gate at all
  (tried first, before science/English) but a full seed-bank scan found zero
  live collisions; flagging as the one remaining residual-risk surface for a
  future run's negative-test pass rather than a defensive rewrite tonight.
- 2026-09-01 (Scout): found and filed an EIGHTH instance (B3 that day's report),
  this time a genuine mathematical-correctness issue rather than a relevance one:
  `math-visual.ts`'s `deriveArray` multiplication branch (line 267) has no
  negative-sign handling at all (unlike its sibling `deriveNumberLine` just
  above it, which already does), so the live `maths_ks3_negatives` mastery
  question "What is −2 × 3?" (correct answer −6) renders a figure asserting
  "2 × 3 = 6" — a positive equation for a negative-answer question. Confirmed
  via live Playwright repro (not just static grep) and confirmed via seed grep
  that it's the ONLY live question triggering it today. Fix + a permanent
  negative-case test for this exact prompt are still pending.
- 2026-09-02 (Scout): re-confirmed the EIGHTH instance (above) is STILL
  unfixed via a fresh code read (line 267 byte-for-byte unchanged) — carried
  forward as this run's own B3 (see the process note under EPIC 19 below on
  why re-carrying matters). Additionally confirmed via a live mock-exam run
  (Ivy, Maths mock Q5, the same "−2 × 3" question) that the MOCK rendering path
  does not use `<figure>` at all, so this bug is scoped to practice/mastery
  only, not the mock — a useful scoping note for whoever fixes it.
- 2026-09-02 (Mechanic): SHIPPED the EIGHTH instance's fix (B3 that day) —
  `deriveArray` now parses signs on both operands and returns `null` (falls
  back to the decorative AI figure) when either is negative, plus the same
  guard for a negative squared base. 5 negative-case tests added.
- 2026-09-03 (Scout): re-confirmed the fix is live via a fresh code read
  (`math-visual.ts:276`, `(-?\d+)` on both capture groups, byte-for-byte
  matches the shipped fix) — did not re-drive the exact live question this
  run (Ivy has progressed past `maths_ks3_negatives`, so a live repro would
  need switching to a fresh child; the code-level confirmation plus the
  existing test coverage was judged sufficient this run). No new instance of
  this bug class found this run.
- 2026-09-08 (Scout, Tuesday perf-focus run): found a NINTH instance, this time
  NOT in a derived SVG figure but in Eddie's own dialogue copy and the See-it
  walkthrough/active-recall task — `src/lib/child/animation-timeline.ts`'s
  `classifyOptions`/`signedValues` treats ANY correct answer containing exactly
  two bare numbers as a ± two-root question (`correctRoots.length === 2`
  fallback, no check the answer is actually root-list-shaped), so a plain
  algebra-expansion answer like "x² − 8x + 16" gets falsely read as having a
  "half right" distractor. Live-confirmed on `maths_quadratics` Mastery Q3
  ("Expand (x − 4)²") wrongly telling Ivy two different wrong options were each
  "only half the answer". Filed as B1 (Critical) this run with a full root
  cause and fix (require a literal ± token or an explicit "x = a or x = b"
  pattern, drop the bare two-number fallback). This is the first instance to
  hit live dialogue/an active-recall task rather than a derived figure — worth
  a future run double-checking `classifyOptions`'s only OTHER call site (the
  "Your turn" `choice_strategy` task) once B1 ships, to confirm the fix closes
  both surfaces at once (it should, since both read the same `fates` array).

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-09-03 (after that
  day's authored items land): eng_comprehension, eng_persuasive, eng_spelling,
  eng_poetry, eng_shakespeare — a shorter tail now, pick 1-2 per run.
  `maths_graphs`, `maths_fractions`, `maths_number`, `maths_geometry`,
  `maths_pythagoras`, `sci_electricity`, `maths_statistics`, `maths_sequences`,
  `sci_cells`, `sci_atoms`, `eng_devices`, `sci_ecology` (pending seed),
  `eng_punctuation` (pending seed), `eng_creative` (pending seed, 2026-09-03)
  and `sci_genetics` (pending seed, 2026-09-03) are now past this bar.
- Done so far: 6 spec-mapped exam-style questions (F7, 2026-08-09) across
  maths_fractions/ratio/number, sci_forces/reactions, eng_devices; steady
  additions through 2026-08-09 → 2026-08-28 across every subject (see prior
  entries in git history for the full per-run list — the remaining-topics list
  above is the authoritative current state, re-derived by grep each run rather
  than trusted from memory).
  2026-08-29 (Scout F1): `maths_graphs` "Write down the equation of the line"
  (gradient + y-intercept → y = mx + c) — a genuinely distinct construction
  skill vs. the topic's existing "work out the gradient from two points" item,
  hand re-derived clean — pending seed.
  2026-09-01 (Scout F1/F2): `maths_inequalities` tier-2 entry item + `sci_ecology`
  second command-word item ("explain why energy transfer is never 100%
  efficient") — both hand re-derived clean, pending seed (STILL unseeded as of
  2026-09-02, re-confirmed by grep — carried forward in today's report as F1/F2).
  2026-09-02 (Scout F3): `eng_punctuation` command-word item ("identify the
  punctuation error...", commas-in-a-list) — hand re-derived clean, pending
  seed, deliberately phrased to avoid overlap with the topic's existing
  apostrophe item.
- VARIETY axis: command-word COVERAGE and question-bank VARIETY are different
  axes — watch topics under active spaced review for a thin-pool symptom (near-
  duplicate phrasings of the same fact across mastery attempts). None newly
  found 2026-08-27 through 2026-09-02. 2026-09-08 (Scout): found ONE — driving
  `maths_quadratics` Mastery check 1 live surfaced Q1 ("Solve x² − 5x + 6 = 0 by
  factorising") and Q2 ("Solve x² − 5x + 6 = 0.", same equation with a figure
  instead of the command word) testing the identical fact back to back. Filed
  as F1 this run with a hand-derived replacement question (different
  coefficients, same shape/kind/tier) pending seed.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. `maths_transformations` and `maths_simultaneous` (both Edexcel
1MA1 gaps) are SHIPPED and confirmed live (the algebra_linear/quadratics
practice pool changes re-verified 2026-08-29 incidentally confirm the
simultaneous-equations topic's prerequisite wiring is intact — `maths_graphs`
still lists correctly as a prerequisite).
- Next step: Science required-practical recall — 2026-09-08 (Scout) finally did
  the human spec check this epic has been asking for since 2026-08-30: live-
  verified the current AQA 8464 required-practical list via AQA's own spec page
  and practicals handbook (Biology: microscopy, osmosis, enzymes, food tests,
  photosynthesis, reaction time, field investigations; Chemistry: making salts,
  temperature changes, rates of reaction, chromatography, electrolysis;
  Physics: specific heat capacity, resistance, I-V characteristics, density).
  Confirmed via grep that NO seed question anywhere currently tests practical
  methodology/evaluation for any of these. Filed as F6 (2026-09-08) — scoped,
  not authored, since a clean single-answer methodology question needs careful
  hand-derivation (many practicals have more than one valid experimental
  control) better done with fresh budget than rushed at the end of a run. A
  future run should author 2-3 items (e.g. against `sci_reactions`'s
  rates-of-reaction practical) as the next concrete step, either as a new
  `sci_practicals` topic or folded into existing topics — interacts with EPIC 22
  below (adding a topic changes the GCSE topic-count denominator EPIC 22 is
  fixing, so land EPIC 22 first or account for the new topic in the same
  change). English extract-based language analysis is comparatively less thin
  now that `eng_analysis` exists and was driven end-to-end 2026-08-30
  (tone/effect/metaphor/simile analysis, all correct) — consider this one
  narrowed, not fully closed.
- Done so far: `maths_mensuration` + `maths_inequalities` (2026-08-09/08-20);
  mock unlock made count-driven so new topics can't break it (2026-08-09);
  `maths_transformations` (authored 08-27, shipped 08-28); `maths_simultaneous`
  (authored 08-28, shipped 08-28 per the same-day report — topic + worked
  example + 3 starters, all live-confirmed).

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE. A real gentle countdown timer, marks/boundary-grade work, the
exam-boundary-grade reveal card, and full question content for `fill_blank`
items pulled into a mock are ALL confirmed shipped and working live. Do not
re-propose a mock timer, the boundary-grade card, or the fill_blank mock-content
fix.
- Next step: nothing new identified 2026-08-29 through 2026-09-08. Keep
  re-verifying rather than re-proposing; EPIC 12 is the epic to extend if a
  future run finds another interaction type with the same generic-wrapper-
  prompt trap.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper
  (F9, 2026-08-09); mark-weighted scoring + a warm, non-pass/fail boundary-grade
  reveal (F7, shipped 2026-08-14/18); calm countdown timer confirmed live
  (2026-08-18); full Maths mock end-to-end re-verified 2026-08-26 and again
  2026-09-02 (Ivy, 10/10, non-calc/Higher-tier framing, real 10-question paper
  incl. hexagon interior angle / standard form / ratio-sharing exam-style
  items, warm boundary-grade reveal with a `Celebration` burst confirmed
  present in source).

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on both sides now). Spaced-rep warm-up +
readiness trajectory schedule deterministically from certification dates/scores
(non-profiling).
- Next step: nothing new identified this run. Keep re-verifying each run rather
  than re-proposing; if a genuinely new gap appears, log it here.
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); the spacing curve widens — a correct recall doubles the interval
  (capped 90 days), an incorrect one resets to 7. Re-verified live end-to-end
  2026-08-29 (Scout): a genuine 3-subject interleaved warm-up as Ivy (Maths
  rounding correct → Science genetic-material wrong, calm reteach line, no red →
  English plural-of-box correct), each subject's own celebration/reteach copy
  distinct and warm. 2026-09-08: confirmed still present (20 reviews due for
  Ivy shown correctly on both `/dashboard` and `/learn`), not re-driven to
  completion this run (budget went to the `maths_quadratics` mastery deep-dive
  instead).

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Every interaction type
(mcq, fill_blank, tap_reveal, drag_drop) now has BOTH a correct settle and a
wrong settle. The mock-exam answer-pick pulse, the reflection-confirmation
entrance, the certificate-page entrance animation, the warm "arrival into
Mastery" transition line, AND Eddie's presence during the breath-break are all
SHIPPED — do not re-propose any of those.
- Next step: 2026-09-08 (Scout) found the See-it walkthrough's own "Your turn"
  active-recall mini-task (the `choice_strategy` beat) has no settle/highlight
  reaction to a tap at all — filed as F4 this run (size S, reuse the existing
  mcq settle-pulse primitives). Once shipped, re-check the diagnostic runner
  (still the one remaining named path never explicitly checked).
- Done so far: every interaction type has its own correct-answer settle
  (2026-08-09); warm hint-card entrance + calm See-it beckon on a miss
  (2026-08-09); calm guiding glow + supportive fill_blank wrong-settle
  (2026-08-11/12); a one-shot settle pulse on phase-bar activation (2026-08-18);
  tap_reveal/drag_drop wrong-answer settle motion (2026-08-18); drag_drop chip
  pick-up lift + a reactive Eddie face on the practice panel (2026-08-19); the
  See-it panel fully collapsing after a correct mastery answer (2026-08-23);
  tap_reveal's reveal/select gesture split (re-verified 2026-08-29 on
  `eng_devices`'s simile card question); Eddie on the mastery reteach screen
  (shipped 2026-08-24, re-confirmed present live 2026-09-08 on a fresh
  `maths_quadratics` reteach); the mock-exam pick pulse (2026-08-26); the
  reflection-confirmation entrance (shipped 2026-08-28); the certificate-page
  entrance (F7, shipped 2026-08-28, re-verified live 2026-08-29); the warm
  "arrival into Mastery" transition line (F2, shipped 2026-08-29); Eddie's
  presence during the breath-break (shipped 2026-08-31, re-verified live
  2026-09-02 AND 2026-09-08, both on fresh two-wrong-in-a-row repros); Eddie on
  the handoff-pause screen (shipped, not re-driven live this run).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; most deps
(mongodb/stripe/jose/@sentry/nextjs/@upstash/redis/@axe-core/playwright/tsx/
vitest/next/@next/bundle-analyzer/@types/node/lucide-react/posthog-js) have been
kept on their in-range "Wanted" versions via a steady drip of small bumps.
- Next step: eslint 10 stays BLOCKED on the Next.js 15→16 migration (peer-dep
  cap). Pair the eventual nonce-based CSP hardening with that move (CSP itself
  spot-checked healthy 2026-09-08 — HSTS+preload, X-Frame-Options DENY,
  Permissions-Policy, nosniff all present; `script-src 'unsafe-inline'` is the
  one known, already-tracked gap). As of 2026-09-08 the in-range batch is:
  `@playwright/test`, `@types/react-dom`, `@upstash/redis`, `autoprefixer`,
  `jose`, `lucide-react`, `postcss`, `posthog-js` — filed as F3 that day, along
  with a `fflate` moderate audit advisory (nested under posthog-js, build/
  bundle-tooling path only). `next`/`eslint`/`@types/node`/`typescript` remain
  deliberate major-version holds.
- Done so far: hero LCP fix + LazyMotion split + ReducedMotionProvider; bundle
  analyzer added; audit stays at 0-1 vulnerabilities (low/moderate, always
  nested/transitive, never in Edway's own code) across every run since
  2026-08-29; type-check + lint GREEN every run. `@axe-core/playwright` wired
  into a real CI a11y job. EPIC 18 (framer-motion → motion) SHIPPED 2026-09-03,
  re-verified live 2026-09-08 (several motion-heavy child surfaces re-driven on
  the migrated package, no regression) — fully retire that sub-item.

## EPIC 8 — Mobile layout regressions
Status: RETIRED 2026-09-03 (Scout) — the exact next step this epic asked for
(a genuinely fresh, non-resize 390×844 page load of the `sci_states` drag_drop
lesson, not a resize-from-desktop) was run this day: `browser_resize` to
390×844 BEFORE navigating, fresh `browser_navigate`, `window.scrollY` 0 at
load, `scrollWidth` 380 (no overflow). Two consecutive clean checks now
(2026-09-02 resize-based, 2026-09-03 fresh-load-based) with no code change in
between and no reproducible overlap either way. Re-open only on a concrete new
repro, not a routine re-check. 2026-09-08: another clean mobile pass on
`/learn`, a `maths_pythagoras` lesson and `/schedule` (all `scrollWidth` 380 at
`innerWidth` 390) — stays retired.
- Next step: none — closed. If a similar "fixed element overlaps scrolled
  content" shape reappears anywhere else, open a fresh epic naming the new
  location rather than reusing this one.

## EPIC 9 — A visual mascot for Eddie
Status: SHIPPED and complete across every scoped call site, including the
breathing/calm-break moment (2026-08-31, re-verified live 2026-09-02 and again
2026-09-08). No further action; re-open only on a concrete new gap.

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Standing every-run spot-check
rather than an active work item; re-open only on a concrete regression.
2026-09-08: robots.txt, sitemap.xml and homepage OG/Twitter meta tags all
re-spot-checked clean.

## EPIC 11 — Dashboard "today" surface conflates weekday-empty with plan-absent
Status: SHIPPED 2026-08-24, re-verified live repeatedly since, including
2026-08-29 (both Sam Smoke's and Ivy's dashboard cards correctly read "Nothing
scheduled … this week's plan is already set" rather than "doesn't have a plan
yet"). No further action; re-open only on a concrete regression.

## EPIC 12 — Mock-exam questions must carry their FULL content, not just `prompt`/`options`
Status: SHIPPED 2026-08-26, re-verified 2026-09-02 (a fresh full Maths mock run
showed real exam-style content on every one of 10 questions, not a generic
wrapper). No further action; re-open only if a future run finds another
interaction type with the same trap in a live mock.

## EPIC 13 — `certified_at` must not move on a re-mastery of an already-certified topic
Status: SHIPPED 2026-08-28, re-verified live via a genuine re-take. No further
action; re-open only on a concrete regression.

## EPIC 14 — Dashboard "today's quest" done-flag ignores overall certified state
Status: SHIPPED 2026-08-28 (Mechanic) via a new `isQuestTopicDone()` OR-ing
`certifiedTags` into the done computation, re-verified live the same day. No
further action; re-open only on a concrete regression.

## EPIC 15 — Cross-topic content/grade-band leaks in the seed data
Status: SHIPPED 2026-08-28 (the `maths_algebra_linear`/`maths_quadratics`
quadratic-expansion leak), re-verified live 2026-08-29 (pool is now 5 items,
none produce an x² term). Next step: an occasional (not every-run) broader
sweep for the same shape elsewhere in the bank — not urgent, only one instance
found so far.

## EPIC 16 — Lesson resume must cover EVERY phase, not just Practice
Status: SHIPPED 2026-08-29 (Mechanic), re-verified live repeatedly since,
including 2026-09-02 (a mid-`fill_blank`-step hard-refresh on
`maths_algebra_linear` resumed at the exact same step with no progress lost).
No further action; re-open only on a concrete regression.

## EPIC 17 — Focus management after a dynamic UI transition
Status: SHIPPED (B1's narrow fix, 2026-08-31), re-verified live 2026-09-02 via
a fresh keyboard-only drive (Tab → radio group → Space to select → Tab → Enter
on "Check answer" all worked correctly; focus stayed on "Check answer" itself
after a wrong answer, which is correct since that exact button remains the
right next action — the fix specifically targets when the CTA node changes,
e.g. to "Keep going", which was also re-confirmed working). F3's broader
`react-aria` `FocusScope` adoption remains a deferred, not-yet-scheduled
enhancement — no second live failing instance has appeared since, so it stays
low-priority.

## EPIC 18 — framer-motion to motion package migration (v11 to v13)
Status: SHIPPED 2026-09-03 (Mechanic) — `npm uninstall framer-motion && npm
install motion`, every import swapped from `"framer-motion"` to
`"motion/react"`. Re-verified live 2026-09-08 (Scout): 0 references to
`framer-motion` remain in `src/`, 64 uses of `motion/react`; several
motion-heavy child surfaces (settle pulses, See-it walkthrough, calm-break
breathing screen) driven live on the migrated package with no visual
regression. Fully retired; re-open only on a concrete new regression tied to
the migration itself.

## EPIC 19 — Server Component await-waterfalls on the highest-traffic pages
Status: ACTIVE, both slices SHIPPED, awaiting a fresh re-measure. Opened
2026-09-01 (Scout, Tuesday performance deep-dive): `/dashboard`, `/schedule`
and `/learn` each blocked full page load for multiple seconds via unbatched
sequential `await` calls.
- 2026-09-02 (Mechanic) SHIPPED the batching fix (B1 that day) across all
  three pages plus `repo.ts`. Live re-measured 2026-09-03 (Scout):
  `/dashboard` think-time dropped from ~7,026ms to ~1,895-2,312ms across two
  fresh loads — a large, real improvement — but still above the fix's own
  ~1.5s target; `/schedule` ~2,069-4,470ms (noisier); `/learn` ~5,131ms.
- 2026-09-03 (Scout) root-caused the residual gap and filed it as B2 that day
  (`getActiveChild()`'s redundant round-trip); 2026-09-03 (Mechanic) SHIPPED it
  the same day (`resolveActiveChild` pure helper in `repo.ts`).
- Next step: NOT re-measured live since the second fix shipped — a future run
  should re-run the same Performance-API technique (`performance.getEntriesByType
  ('navigation')[0]`, `responseEnd - responseStart`) on `/dashboard`,
  `/schedule` and `/learn` and confirm the gap finally reaches `/settings`'s
  ~600ms baseline. 2026-09-08 (Scout) instead found a DIFFERENT, unrelated perf
  gap on the marketing homepage (cold-load LCP 4.58s, filed as F2 that day) —
  the dedicated chrome-devtools trace to root-cause it wasn't completed this
  run (session dropped mid-run), so that's also a concrete next step: a
  `performance_start_trace` + `LCPBreakdown` insight pass on `/`.
- Done so far: both the await-waterfall batching AND the `getActiveChild`
  round-trip removal are shipped and live per git log, not yet re-measured
  since the second fix.
  **PROCESS NOTE (still relevant):** Mechanic reads only *today's* findings
  file, with no fallback once today's file exists — keep re-verifying and
  re-carrying forward any still-open item rather than assuming a report was
  read just because a day has passed.

## EPIC 20 — Homepage hydration mismatch (React error #418)
Status: RETIRED 2026-09-03 (Scout) — a THIRD consecutive clean re-check (fresh
`browser_navigate('https://edway.uk/')`, zero console errors) with no
homepage-touching code change across any of the three checks. Opened
2026-09-01 with full repro evidence (B2 that day); did not reproduce on
2026-09-02 or 2026-09-03. 2026-09-08: a FOURTH clean re-check (two fresh
homepage loads this run, zero console errors both times). Re-open a fresh
entry (not this one) if it recurs.

## EPIC 21 — Auth session hygiene: not every page redirects on an invalidated session
Status: SHIPPED 2026-09-02 (Mechanic), not yet independently live-re-verified
(invalidating a real session's `token_version` or deleting a test account is a
more invasive check than a routine run's budget favours). Not touched
2026-09-08. Next step unchanged: a future run should do the live
invalidate-and-confirm check, plus the residual-risk grep (every
`(dashboard)`/`(child)` page.tsx for a matching null-guard on
`currentParentId()`), before fully retiring this epic.

## EPIC 22 (new) — Curriculum-size constants must derive from the real topic count, not a hardcoded number
Status: NEW, opened 2026-09-08 (Scout, B2 that day). `TOTAL_TOPICS = 30` in
`dashboard/page.tsx` and `PORTFOLIO_TOTAL_TOPICS = 30` / `PORTFOLIO_TOPICS_PER_
SUBJECT = 10` in `api/portfolio/route.ts` were both correct when written but
never revisited as EPIC 2/3 grew the curriculum (maths alone is now 14 GCSE
topics, not 10). Live-confirmed dual impact: the dashboard child card shows
Ivy's "Curriculum mastery 31 / 30" (a >100% progress bar), and a REAL generated
compliance portfolio for Ivy reads "Curriculum 30/30 topics certified" /
Mathematics "10/10 certified, complete" while she is genuinely still mid-lesson
on an uncertified GCSE maths topic — the more serious half, since this is a
document literally titled "Local Authority portfolio" and marked "Verified".
- Next step: ship B2's fix (reuse `lib/engine/mock-gate.ts`'s existing
  `gcseTopicCount(subject)` helper — built for exactly this problem on the
  mock-unlock gate already — in both call sites instead of maintaining
  separate hardcoded totals), then live-re-verify: (1) the dashboard progress
  bar never exceeds 100% for any child, (2) a freshly-generated portfolio's
  per-subject "X/Y certified" reflects the REAL current GCSE topic count per
  subject, not a stale 10. Also decide (owner call, note in the fix's PR
  description either way): should pre-GCSE band-topic certifications count
  toward the GCSE-readiness percentage at all, or only toward a separate
  "foundations" line? The current bug accidentally blends the two; the fix
  should make that choice deliberate, not silent. EPIC 3's science-practicals
  slice (a new `sci_practicals` topic, if pursued) will change the exact GCSE
  topic count again, so land this epic before or alongside that one.
- Done so far: filed only (B2, 2026-09-08); not yet shipped.
