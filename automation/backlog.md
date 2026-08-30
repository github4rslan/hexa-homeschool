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
  now SIX distinct real bugs of this shallow-regex/keyword-match-on-raw-prompt-text
  class across math-visual.ts, teaching-animations.ts, english-visual.ts (three
  times now), and science-visual.ts. Keep spot-checking a derived figure against
  its own question every run, and specifically watch for heuristics with an
  unguarded "else"/default branch — that is its own named risk pattern (see the
  2026-08-28 note below). A NEW standing next-step (2026-08-30, F7 in that day's
  report): add curated NEGATIVE test cases to every deriveXVisual heuristic (not
  just positive-match cases) so this class stops shipping reactively one instance
  at a time — seed the negative-case list from every prompt that has broken so
  far (see the per-date notes below for the exact text of each).
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

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-08-29 (after that
  day's 1 authored item lands): eng_comprehension, eng_persuasive, sci_genetics,
  sci_ecology, eng_punctuation, eng_spelling, eng_poetry, eng_shakespeare,
  eng_creative — still a tail, pick 1-2 per run. `maths_graphs`,
  `maths_fractions`, `maths_number`, `maths_geometry`, `maths_pythagoras`,
  `sci_electricity`, `maths_statistics`, `maths_sequences`, `sci_cells`,
  `sci_atoms` and `eng_devices` are now past this bar. Not touched 2026-08-30
  (today's curriculum authoring effort went to EPIC 1's tier-range gap instead).
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
- VARIETY axis: command-word COVERAGE and question-bank VARIETY are different
  axes — watch topics under active spaced review for a thin-pool symptom (near-
  duplicate phrasings of the same fact across mastery attempts). None newly
  found 2026-08-27, 08-28, 08-29 or 08-30.

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
  consider this one narrowed, not fully closed.
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
- Next step: nothing new identified 2026-08-29 or 2026-08-30 — `scoreMock()`
  (lib/engine/mock-exam.ts) was re-read 2026-08-30 as part of the standing
  engine check and looks sound (mark-weighted blend of demonstrated-ceiling tier
  and paper-difficulty tier, clamped 1-5); the mock itself wasn't re-driven live
  either day. Keep re-verifying rather than re-proposing; EPIC 12 is the epic to
  extend if a future run finds another interaction type with the same
  generic-wrapper-prompt trap.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper
  (F9, 2026-08-09); mark-weighted scoring + a warm, non-pass/fail boundary-grade
  reveal (F7, shipped 2026-08-14/18); calm countdown timer confirmed live
  (2026-08-18); full Maths mock end-to-end re-verified 2026-08-26.

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
entrance, the certificate-page entrance animation, and the warm "arrival into
Mastery" transition line are all SHIPPED — do not re-propose any of those.
- Next step: F2 (2026-08-30) — Eddie (`EddieAvatar`) has NO presence during the
  breathing/calm-break moment (`BreathBreak` in practice-player.tsx, triggered
  either by 2+ consecutive struggled questions OR an immediate "attention"-
  category miss via `shouldOfferBreak()` in `lib/child/eddie-copy.ts`) — today
  it's just a generic pulsing Wind icon, the one reactive moment in the whole
  lesson with no mascot at all, despite every OTHER reaction moment (correct,
  reteach, celebration) having one. Small, well-scoped fix.
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
  Mastery" transition line (F2, shipped 2026-08-29, live-verified via a
  MutationObserver since the transient element is too fast for a manual
  snapshot round-trip).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; most deps
(mongodb/stripe/jose/@sentry/nextjs/@upstash/redis/@axe-core/playwright/tsx/
vitest/next/@next/bundle-analyzer/@types/node/lucide-react/posthog-js) have been
kept on their in-range "Wanted" versions via a steady drip of small bumps.
- Next step: eslint 10 stays BLOCKED on the Next.js 15→16 migration (peer-dep
  cap). Pair the eventual nonce-based CSP hardening with that move. Routine
  in-range batch shipped 2026-08-29 (`@sentry/nextjs`/`eslint-config-next`/
  `lucide-react`/`posthog-js`); as of 2026-08-30 the only remaining safe patch
  is `tsx` 4.23.12→4.23.13 (filed F8, 2026-08-30) — everything else outdated
  (`next`, `eslint`, `eslint-config-next`, `@next/bundle-analyzer`, `@types/node`,
  `typescript`) is a deliberate major-version hold. **NEW (2026-08-30, F6):**
  `framer-motion` is pinned at `^11.15.0` (already at its own range ceiling)
  while the package's real latest is `13.1.1` — a 2-major gap, and the
  maintainers have rebranded the primary package to `motion` (framer-motion is
  now a compat re-export). Given animation is a headline delight lane and this
  dependency touches nearly every child-facing surface, treat this as a
  RESEARCH SPIKE first (read the v12→v13 changelog against this codebase's
  actual usage), not a routine bump — too much blast radius to blind-bump.
- Done so far: hero LCP fix + LazyMotion split + ReducedMotionProvider; bundle
  analyzer added; audit stays at 0 vulnerabilities (re-confirmed 2026-08-30,
  both prod-only and full tree — `npm test` also re-confirmed green, 915/915).
  `@axe-core/playwright` wired into a real CI a11y job. Steady dependency
  freshness bumps through 2026-08-29.

## EPIC 8 — Mobile layout regressions
Status: ACTIVE again — RETIRED 2026-08-19 as the original bare-`grid` pattern,
but the DIFFERENT "fixed element overlaps scrolled content" shape (opened
2026-08-29 as its own B2, `FocusFrame`'s "Exit lesson" pill) has now recurred
TWICE. **2026-08-30 (Scout): the 2026-08-29 `pt-20`/`pt-24` padding fix does
NOT fully hold** — the exact same `sci_states` drag_drop repro (place all 3
chips at 390×844) still measurably overlaps the pill with the question heading
for this TALLER question (a figure + 3 slots + button), because a fixed top
padding on a `justify-center` wrapper only shifts where centring starts, it
doesn't prevent overflow once content is taller than the fix was verified
against. Filed as a fresh B2, 2026-08-30, with a more durable fix proposal
(`scroll-margin-top` on the content itself, or drop `justify-center` for
oversized content) rather than another padding-number tweak.
- Next step: ship the 2026-08-30 B2 fix, then re-verify BOTH the short-question
  repro from 2026-08-29 AND the taller `sci_states`/`maths_geometry`/
  `eng_devices` repros from 2026-08-30 before calling this closed again — a
  single-repro "it's fixed" claim has now been wrong twice in a row for this
  exact bug class, so verify broadly this time.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19, present at almost every scoped call
site — EXCEPT the breathing/calm-break moment, a fresh gap found 2026-08-30
(see EPIC 6's F2). Once that ships, consider this epic's build-out complete
again.

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Standing every-run spot-check
rather than an active work item; re-open only on a concrete regression.

## EPIC 11 — Dashboard "today" surface conflates weekday-empty with plan-absent
Status: SHIPPED 2026-08-24, re-verified live repeatedly since, including
2026-08-29 (both Sam Smoke's and Ivy's dashboard cards correctly read "Nothing
scheduled … this week's plan is already set" rather than "doesn't have a plan
yet"). No further action; re-open only on a concrete regression.

## EPIC 12 — Mock-exam questions must carry their FULL content, not just `prompt`/`options`
Status: SHIPPED 2026-08-26, re-verified. No further action; re-open only if a
future run finds another interaction type with the same generic-wrapper-prompt
trap in a live mock.

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
Status: SHIPPED 2026-08-29 (Mechanic), re-verified live 2026-08-30 (Scout) via
the exact repro that opened this epic: refreshed mid "Mastery check 1: 2 of 3"
on a fresh `eng_analysis` certification attempt and landed back on the correct
mastery step with score intact, NOT the Explainer. No further action; re-open
only on a concrete regression.

## EPIC 18 (new): framer-motion to motion package migration (v11 to v13)
Status: RESEARCHED, not yet built. Opened 2026-08-30 (F6, a Sunday latest-stack
spike), researched 2026-08-31 (Mechanic) by reading the vendor's own official
upgrade guide (motion.dev/docs/react-upgrade-guide) rather than guessing from
changelog headlines.
- Findings: the actual migration from our pinned `framer-motion@^11.15.0` to
  the current `motion@13.1.1` is smaller and safer than the original finding's
  risk estimate suggested. There is exactly ONE mechanical step for a project
  with our usage pattern: `npm uninstall framer-motion && npm install motion`,
  then swap every `from "framer-motion"` import to `from "motion/react"`
  (the API itself, `motion.div`, `AnimatePresence`, `whileTap`, `useReducedMotion`,
  `LazyMotion`, is unchanged across v11 to v13). Version 12 has NO breaking
  React API changes at all (confirmed on the vendor's own guide: "There are no
  breaking changes in Motion for React in version 12"). Version 13's one
  breaking change removes `@emotion/is-prop-valid` as an optional dependency,
  which only affects styled-components/Emotion CSS-in-JS users; this repo has
  neither dependency (confirmed via `package.json`, Tailwind only), so it does
  not apply to us at all.
- Next step for a future dedicated run (still not a routine bump, per the
  original finding's own reasoning): do the import-path swap across every
  file using `framer-motion` (grep confirms roughly a dozen+ child-facing
  components), run the full gate, then a live Playwright smoke across several
  lesson states (celebration, mascot moods, hint entrance, phase-bar) on BOTH
  the motion and `prefers-reduced-motion` paths, since this touches nearly
  every child-facing animation in the app even though the migration itself is
  now known to be low-risk.
- Done so far: research only (this note); no code changed, no package
  installed. `npm audit` unaffected either way (0 vulnerabilities on both the
  current pin and the target version per `npm view`).

## EPIC 17 (new) — Focus management after a dynamic UI transition
Status: NEW, opened 2026-08-30. A pattern distinct from EPIC 16 (which was
about DATA persistence across a hard refresh) — this is about WHERE KEYBOARD
FOCUS LANDS after a same-session UI swap. Confirmed live: `practice-player.tsx`
swaps the "Check answer" button for a different "Keep going"/"Start mastery"/
"Finish" button via conditional rendering (not a relabel of one stable node),
which destroys the focused DOM element; the browser resets focus to `<body>`,
and the child's next Tab press restarts the ENTIRE page's tab sequence from
the logo at the very top, costing ~8 extra Tab presses to reach the next
primary action — repeated on every single question, in every lesson. Filed as
B1, 2026-08-30 (Medium/High — a systemic, compounding a11y burden for any
keyboard-only or switch-access child, not a one-off).
- Next step: ship B1's narrow fix (a `ref` + `useEffect` calling `.focus()` on
  the new CTA when it mounts). Separately, F3 (2026-08-30) proposes the more
  systemic version: adopt `react-aria`'s `FocusScope` (owner-pre-approved
  library for "accessible interaction primitives for SEND-grade custom
  controls") across the practice-player's transition points generally, so this
  whole CLASS of "region swaps, focus gets lost" bug can't recur at some other
  transition point Scout hasn't found yet. Live-verify by repeating the exact
  keyboard repro (Tab/Arrow/Enter through a full mcq answer) and confirming the
  very next Tab lands on the primary CTA, not the page logo.
- Done so far: nothing shipped yet — fresh epic from today's live
  keyboard-only Playwright drive (Tab/ArrowDown/Enter through a real mcq
  answer, not just a code-only audit find). 2026-08-31 (Mechanic): B1's
  narrow fix shipped and live (`5e0978d`), closing the urgent instance.
  F3's react-aria `FocusScope` adoption was judged best deferred rather
  than rushed in alongside the rest of that night's items: it is a new
  dependency plus a refactor of the practice-player's other region swaps
  (chip trays, tap_reveal cards), not a bug fix, with no second live
  failing instance to anchor it against that night. Next step for a
  future dedicated run: adopt `FocusScope` across all transition points
  and live-verify the keyboard repro at each one, its own commit, not
  folded into a routine nightly item.
