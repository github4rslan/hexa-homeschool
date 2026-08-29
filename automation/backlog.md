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
  now FIVE distinct real bugs of this shallow-regex/keyword-match-on-raw-prompt-text
  class across math-visual.ts, teaching-animations.ts, english-visual.ts (twice),
  and science-visual.ts. Keep spot-checking a derived figure against its own
  question every run, and specifically watch for heuristics with an unguarded
  "else"/default branch — that is its own named risk pattern (see the 2026-08-28
  note below).
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

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-08-29 (after today's 1
  authored item lands): eng_comprehension, eng_persuasive, sci_genetics,
  sci_ecology, eng_punctuation, eng_spelling, eng_poetry, eng_shakespeare,
  eng_creative — still a tail, pick 1-2 per run. `maths_graphs` (via today's F1),
  `maths_fractions`, `maths_number`, `maths_geometry`, `maths_pythagoras`,
  `sci_electricity`, `maths_statistics`, `maths_sequences`, `sci_cells`,
  `sci_atoms` and `eng_devices` are now past this bar.
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
  found 2026-08-27, 08-28, or 08-29.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. `maths_transformations` and `maths_simultaneous` (both Edexcel
1MA1 gaps) are SHIPPED and confirmed live (the algebra_linear/quadratics
practice pool changes re-verified 2026-08-29 incidentally confirm the
simultaneous-equations topic's prerequisite wiring is intact — `maths_graphs`
still lists correctly as a prerequisite).
- Next step: Science required-practical recall (e.g. magnification, titration,
  rate-of-reaction methodology) and English extract-based language analysis
  remain unscoped thin areas for a future run's headline curriculum item.
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
- Next step: nothing new identified this run — the mock wasn't re-driven this
  run (the smoke child's Maths mock was unlocked at the top of the hub, but no
  new mock-specific gap surfaced from code review, and consuming this week's
  attempt wasn't necessary to verify anything new). Keep re-verifying rather
  than re-proposing; EPIC 12 is the epic to extend if a future run finds another
  interaction type with the same generic-wrapper-prompt trap.
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
entrance, and the certificate-page entrance animation are all SHIPPED — do not
re-propose.
- Next step: F2 (2026-08-29) — a small warm, non-test-framed transition line the
  moment Practice hands off into Mastery (today the phase-bar segment pulse is
  the only signal, easy to miss); copy must stay inside the calm-wrong law even
  though this is a correct-path moment (no "good luck"/exam-pressure framing).
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
  (F7, shipped 2026-08-28, re-verified live 2026-08-29 — computed style settled
  cleanly after a real `maths_geometry` re-mastery).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; most deps
(mongodb/stripe/jose/@sentry/nextjs/@upstash/redis/@axe-core/playwright/tsx/
vitest/next/@next/bundle-analyzer/@types/node/lucide-react/posthog-js) have been
kept on their in-range "Wanted" versions via a steady drip of small bumps.
- Next step: eslint 10 stays BLOCKED on the Next.js 15→16 migration (peer-dep
  cap). Pair the eventual nonce-based CSP hardening with that move. Another
  small in-range batch is available as of 2026-08-29: `@sentry/nextjs`
  10.71.0→10.72.0, `eslint-config-next` 15.5.23→15.5.24, `lucide-react`
  1.35.0→1.37.0, `posthog-js` 1.422.3→1.422.5 — filed as F6, 2026-08-29,
  routine and independent of the Next 16 staged migration.
- Done so far: hero LCP fix + LazyMotion split + ReducedMotionProvider; bundle
  analyzer added; audit stays at 0 vulnerabilities (re-confirmed 2026-08-29,
  both prod-only and full tree — `npm test` also re-confirmed green, 901/901).
  `@axe-core/playwright` wired into a real CI a11y job. Steady dependency
  freshness bumps through 2026-08-28.

## EPIC 8 — Mobile layout regressions: sweep the bare `grid` pattern
Status: RETIRED as an active risk 2026-08-19, re-confirmed clean repeatedly
since. **NOTE (2026-08-29): a genuinely NEW mobile layout bug was found this
run, but it is a different shape** — not the bare-grid overflow this epic
tracked, but a fixed-position element (`FocusFrame`'s "Exit lesson" pill)
overlapping scrolled content. Filed as its own item (B2, 2026-08-29) rather than
reopening this epic, since the root cause and fix are unrelated to the grid
pattern. Keep both classes in mind on future mobile sweeps.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19, present at every scoped call site.
Consider this epic's build-out essentially complete; keep the standing
re-verify-don't-re-propose posture. No new gap found 2026-08-29.

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

## EPIC 16 (new) — Lesson resume must cover EVERY phase, not just Practice
Status: NEW, opened 2026-08-29. `lesson_progress` persistence
(`practice-player.tsx`'s `persist()`/`resolveResumeStep` mechanism) only ever
writes a checkpoint during the Practice phase. The moment a child reaches
Mastery (or Reteach, or the five-attempt Handoff pause), there is ZERO further
persistence for the rest of the session — `lessonPhase` always initialises to
`"practice"` on a fresh mount with no signal that the child had progressed
further, so a refresh, crash, or back-navigation anywhere past Practice sends
the child all the way back to the Explainer, discarding a finished Practice
pass and any Mastery answers already given. Live-reproduced exactly on
`eng_devices` this run (refreshed mid "Mastery check 1: 2 of 3" → landed back
on the Explainer). This is NOT `isReview`-specific — it applies identically to
a first-time certification attempt. Filed as B1, 2026-08-29 (Critical/High —
this is arguably the most valuable resilience bug found in many runs, directly
contradicting the documented "interrupted child resumes at the exact step"
architecture promise).
- Next step: ship B1's fix — extend the persisted checkpoint with an optional
  `phase`/`masteryAttempt` (default `"practice"` for legacy rows), call the
  mastery-phase equivalent of `persist()` after each answered mastery question,
  and make the mount-time resume logic route into `"mastery"` at the saved
  step/attempt instead of falling through to a full Explainer replay. Live-
  verify by reproducing the exact repro (refresh mid Mastery-question-2) post-
  fix and confirming the child lands back on the correct mastery step, not the
  Explainer. Reteach/Handoff can reasonably stay non-resumable as a first cut,
  as long as the fallback (restart Mastery attempt 1, calmly) is materially
  better than today's silent full-lesson reset.
- Done so far: nothing shipped yet — fresh epic from today's live Playwright
  resilience drive (a deliberate mid-refresh test, not a code-only audit find).
