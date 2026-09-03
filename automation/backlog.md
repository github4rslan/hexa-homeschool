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
  deletes), not just reword the prompt. The DERIVED VISUALS built from a question's
  prompt string remain a separate correctness surface from the seed text itself —
  now EIGHT distinct real bugs of this shallow-regex/keyword-match-on-raw-prompt-text
  class across math-visual.ts, teaching-animations.ts, english-visual.ts (three
  times now), and science-visual.ts (twice). Keep spot-checking a derived figure
  against its own question every run, and specifically watch for heuristics with an
  unguarded "else"/default branch — that is its own named risk pattern (see the
  2026-08-28 note below). The 2026-08-30/08-31 negative-case-test standing
  next-step is now partly done (see the 2026-08-31 entry) — `math-visual.ts`'s
  `deriveArray` still needs its own negative-case test once the eighth instance
  (below) is fixed.
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
  found 2026-08-27 through 2026-09-02.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. `maths_transformations` and `maths_simultaneous` (both Edexcel
1MA1 gaps) are SHIPPED and confirmed live (the algebra_linear/quadratics
practice pool changes re-verified 2026-08-29 incidentally confirm the
simultaneous-equations topic's prerequisite wiring is intact — `maths_graphs`
still lists correctly as a prerequisite).
- Next step: Science required-practical recall (e.g. magnification, titration,
  rate-of-reaction methodology) remains an unscoped thin area — 2026-08-30
  (Scout, F5) deliberately did NOT author against it (the exact current AQA 8464
  required-practical list/numbering needs a human check against the live spec
  sheet first, per the hard authoring rule against citing a spec reference
  Scout isn't confident is current) but named the gap precisely: a future run
  should confirm the spec list then author 2-3 methodology-recall
  ("describe how you would...", "evaluate this method...") questions, likely as
  a new `sci_practicals` topic. English extract-based language analysis is
  comparatively less thin now that `eng_analysis` exists and was driven
  end-to-end 2026-08-30 (tone/effect/metaphor/simile analysis, all correct) —
  consider this one narrowed, not fully closed. Not touched 2026-09-01/09-02.
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
- Next step: nothing new identified 2026-08-29 through 2026-09-02. Keep
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
  distinct and warm.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Every interaction type
(mcq, fill_blank, tap_reveal, drag_drop) now has BOTH a correct settle and a
wrong settle. The mock-exam answer-pick pulse, the reflection-confirmation
entrance, the certificate-page entrance animation, the warm "arrival into
Mastery" transition line, AND Eddie's presence during the breath-break are all
SHIPPED — do not re-propose any of those.
- Next step: nothing new identified 2026-09-02 (a full Wednesday delight
  deep-dive re-verified the lane rather than finding a gap — see that day's
  report for the specific live-verified list). 2026-09-03 (Scout) checked two
  of the named less-common paths: the warm-up/review flow's own completion
  celebration IS already present ("Warm-up done! 🌟", star burst — confirmed
  live, not a gap), but the handoff-pause screen (the 5-attempt human-tutor
  handoff) has NO Eddie at all, just a generic HeartHandshake icon — filed as
  F3 that day (size S: reuse the exact `<EddieAvatar mood="encouraging" .../>`
  pattern already used on the mastery reteach screen). Once shipped, the
  diagnostic runner is the one remaining named path still unchecked.
- Done so far: every interaction type has its own correct-answer settle
  (2026-08-09); warm hint-card entrance + calm See-it beckon on a miss
  (2026-08-09); calm guiding glow + supportive fill_blank wrong-settle
  (2026-08-11/12); a one-shot settle pulse on phase-bar activation (2026-08-18);
  tap_reveal/drag_drop wrong-answer settle motion (2026-08-18); drag_drop chip
  pick-up lift + a reactive Eddie face on the practice panel (2026-08-19); the
  See-it panel fully collapsing after a correct mastery answer (2026-08-23);
  tap_reveal's reveal/select gesture split (re-verified 2026-08-29 on
  `eng_devices`'s simile card question); Eddie on the mastery reteach screen
  (shipped 2026-08-24); the mock-exam pick pulse (2026-08-26); the reflection-
  confirmation entrance (shipped 2026-08-28); the certificate-page entrance
  (F7, shipped 2026-08-28, re-verified live 2026-08-29); the warm "arrival into
  Mastery" transition line (F2, shipped 2026-08-29); Eddie's presence during
  the breath-break (shipped 2026-08-31, re-verified live 2026-09-02 on a fresh
  `sci_ks3_cells` two-wrong-in-a-row repro — the small smiley-face circle sits
  next to the wind icon, exactly as designed).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; most deps
(mongodb/stripe/jose/@sentry/nextjs/@upstash/redis/@axe-core/playwright/tsx/
vitest/next/@next/bundle-analyzer/@types/node/lucide-react/posthog-js) have been
kept on their in-range "Wanted" versions via a steady drip of small bumps.
- Next step: eslint 10 stays BLOCKED on the Next.js 15→16 migration (peer-dep
  cap). Pair the eventual nonce-based CSP hardening with that move. As of
  2026-09-02 the in-range batch is: `@sentry/nextjs`, `lucide-react`,
  `@next/bundle-analyzer`, `eslint-config-next`, `posthog-js`, `stripe` — filed
  as F5 that day. `next`/`eslint`/`@types/node`/`typescript`/`framer-motion`
  remain deliberate major-version holds.
- Done so far: hero LCP fix + LazyMotion split + ReducedMotionProvider; bundle
  analyzer added; audit stays at 0 vulnerabilities (re-confirmed 2026-09-02,
  both prod-only and full tree, type-check + lint also GREEN). `@axe-core/
  playwright` wired into a real CI a11y job. Steady dependency freshness bumps
  through 2026-08-29.

## EPIC 8 — Mobile layout regressions
Status: RETIRED 2026-09-03 (Scout) — the exact next step this epic asked for
(a genuinely fresh, non-resize 390×844 page load of the `sci_states` drag_drop
lesson, not a resize-from-desktop) was run this day: `browser_resize` to
390×844 BEFORE navigating, fresh `browser_navigate`, `window.scrollY` 0 at
load, `scrollWidth` 380 (no overflow). Two consecutive clean checks now
(2026-09-02 resize-based, 2026-09-03 fresh-load-based) with no code change in
between and no reproducible overlap either way. Re-open only on a concrete new
repro, not a routine re-check.
- Next step: none — closed. If a similar "fixed element overlaps scrolled
  content" shape reappears anywhere else, open a fresh epic naming the new
  location rather than reusing this one.
- Done so far (history): RETIRED once 2026-08-19 (the original bare-`grid`
  pattern), reopened 2026-08-29 (a NEW "fixed element overlaps scrolled
  content" shape), the 2026-08-29 `pt-20`/`pt-24` fix did NOT fully hold against
  a taller question (2026-08-30 B2), a more durable `scroll-margin-top` fix
  shipped 2026-08-31 (B2) — 2026-09-02's re-check found no reproducible overlap.

## EPIC 9 — A visual mascot for Eddie
Status: SHIPPED and complete across every scoped call site, including the
breathing/calm-break moment (2026-08-31, re-verified live 2026-09-02). No
further action; re-open only on a concrete new gap.

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Standing every-run spot-check
rather than an active work item; re-open only on a concrete regression.

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
Status: RESEARCHED, ready to execute. Opened 2026-08-30 (F6, a Sunday
latest-stack spike), researched 2026-08-31 (Mechanic) by reading the vendor's
own official upgrade guide (motion.dev/docs/react-upgrade-guide) rather than
guessing from changelog headlines. Re-surfaced 2026-09-03 (Scout, F4) as a
ready-to-build execution task since `npm outdated` confirms nothing has
changed (`framer-motion` still pinned 11.18.2, latest is now 13.2.0) — no
further research needed, just scheduling the execution run.
- Findings: the actual migration from our pinned `framer-motion@^11.15.0` to
  the current `motion@13.1.1` is smaller and safer than the original finding's
  risk estimate suggested. There is exactly ONE mechanical step for a project
  with our usage pattern: `npm uninstall framer-motion && npm install motion`,
  then swap every `from "framer-motion"` import to `from "motion/react"`
  (the API itself, `motion.div`, `AnimatePresence`, `whileTap`, `useReducedMotion`,
  `LazyMotion`, is unchanged across v11 to v13). Version 12 has NO breaking
  React API changes at all. Version 13's one breaking change (removing
  `@emotion/is-prop-valid`) doesn't apply to this repo (Tailwind only, no
  styled-components/Emotion).
- Next step for a future dedicated run: do the import-path swap across every
  file using `framer-motion` (roughly a dozen+ child-facing components), run
  the full gate, then a live Playwright smoke across several lesson states on
  BOTH the motion and `prefers-reduced-motion` paths.
- Done so far: research only; no code changed, no package installed.

## EPIC 19 — Server Component await-waterfalls on the highest-traffic pages
Status: ACTIVE, first slice SHIPPED, a second slice found. Opened 2026-09-01
(Scout, Tuesday performance deep-dive): `/dashboard`, `/schedule` and
`/learn` each blocked full page load for multiple seconds via unbatched
sequential `await` calls.
- 2026-09-02 (Mechanic) SHIPPED the batching fix (B1 that day) across all
  three pages plus `repo.ts`. Live re-measured 2026-09-03 (Scout):
  `/dashboard` think-time dropped from ~7,026ms to ~1,895-2,312ms across two
  fresh loads — a large, real improvement — but still above the fix's own
  ~1.5s target; `/schedule` ~2,069-4,470ms (noisier); `/learn` ~5,131ms.
- 2026-09-03 (Scout) root-caused the residual gap and filed it as B2 that
  day: `getActiveChild()` still issues its OWN serial DB round-trip on all
  three pages, positioned between two `Promise.all` batches, even though the
  sibling child list (`listChildren`/`kids`) already fetched on the same page
  contains everything needed to resolve it locally (`getChildById` = find by
  `_id` in the already-fetched list; `latestChild` = the last element of that
  list, since `listChildren` sorts `created_at` ascending). A pure
  `resolveActiveChild(children, preferredId)` helper removes a full extra
  Mongo round-trip from all three highest-traffic pages.
- Next step: ship B2 (2026-09-03), then re-measure all three pages again with
  the same Performance-API technique and confirm the gap finally reaches
  `/settings`'s ~600ms baseline. If it doesn't, the remaining stages
  (`parentId` resolution itself, or genuinely slow individual queries within
  the big batch) need their own profiling pass.
- Done so far: the original await-waterfall batching is shipped and live
  (confirmed via `grep -c Promise.all` showing the fix is in place, and via
  live measurement showing a real ~5s improvement on `/dashboard`). The
  `getActiveChild` redundant-round-trip slice is filed, not yet shipped.
  **PROCESS NOTE (2026-09-02, still relevant):** Mechanic reads only *today's*
  findings file, with no fallback once today's file exists — keep
  re-verifying and re-carrying forward any still-open item rather than
  assuming a report was read just because a day has passed.

## EPIC 20 — Homepage hydration mismatch (React error #418)
Status: RETIRED 2026-09-03 (Scout) — a THIRD consecutive clean re-check (fresh
`browser_navigate('https://edway.uk/')`, zero console errors) with no
homepage-touching code change across any of the three checks. Opened
2026-09-01 with full repro evidence (B2 that day); did not reproduce on
2026-09-02 or 2026-09-03. Re-open a fresh entry (not this one) if it recurs —
if it does, the debugging step is still the same: reproduce against a
non-minified dev build for the full unminified error message naming the exact
component/tag.

## EPIC 21 (new) — Auth session hygiene: not every page redirects on an invalidated session
Status: NEW, opened 2026-09-02 (Scout). Found while cleaning up a disposable
signup-test account: `dashboard/page.tsx` is the ONE page in the app that does
NOT redirect to `/login` when `currentParentId()` returns `null` (a session
whose JWT is still validly signed but whose parent row no longer exists, or
whose `token_version` no longer matches — i.e. a deleted account, or a "sign
out everywhere" / password-change invalidation of another device's session).
Instead it silently falls through to the same "Let's set up your first child"
empty state a genuine brand-new zero-children account sees. `schedule/page.tsx`
and `settings/page.tsx` both correctly guard with
`if (!parentId) redirect("/login?redirect=/...")` right after the same
`currentParentId()` call, so this is an isolated one-line miss on the single
highest-traffic page, not a systemic pattern — but it directly undermines the
clarity of the "sign out everywhere" security feature (the kicked-out device
looks like it's still working instead of clearly being signed out). No child
data is exposed either way (the data-silo holds; this is a confusing-state bug,
not a leak).
- Next step: 2026-09-02 (Mechanic) SHIPPED the one-line guard (B2 that day).
  2026-09-03 (Scout) did NOT independently re-verify the redirect live this
  run (invalidating a real session's `token_version` or deleting a test
  account is a more invasive check than this run's budget favoured given the
  code fix was already confirmed landed); a future run should do the live
  invalidate-and-confirm check named below before fully retiring this epic.
  The residual-risk grep (every `(dashboard)`/`(child)` page.tsx for a
  matching null-guard on `currentParentId()`) also still hasn't been run.
- Done so far: SHIPPED 2026-09-02 (Mechanic), not yet independently
  live-re-verified.
