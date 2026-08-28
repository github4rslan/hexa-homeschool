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
  "else"/default branch (2026-08-28's plural-rule bug is that shape, not a
  keyword-collision) — that is now its own named risk pattern, see below.
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
  arithmetic for a "5x + 2 − 3x" collect-like-terms question, and B2 a Science
  "See the process" template rendering on an English alliteration question
  because the prompt contains the word "sound". Both fixed + shipped 2026-08-22 —
  live-reconfirmed 2026-08-23 the fix holds. 2026-08-23 found a THIRD of the same
  class in `english-visual.ts`'s `letter_tiles` deriver — fixed + shipped
  2026-08-24. 2026-08-27 found a FOURTH: `deriveScienceVisual`'s `states_of_matter`
  branch (unconditional bare `"gas"` keyword match, no topic gate) live-reproduced
  on `sci_body`'s "gas exchange in the lungs" question (wrong Solid/Liquid/Gas
  figure), also confirmed hitting `sci_reactions` and `sci_ecology` prompts by
  source — SHIPPED 2026-08-28 (dropped the bare "gas" needles), plus a companion
  `sci_body` figure added (F5, respiratory/circulatory SVGs) — live-reconfirmed
  2026-08-28 the exact "gas exchange" question now shows the correct new figure.
- 2026-08-28 (Scout): found a FIFTH instance, and the worst one yet —
  `english-visual.ts`'s `pluralRuleFor` (a suffix-only heuristic: `ch/sh/s/x/z`→
  `+es`, consonant+`y`→`+ies`, else→`+s`) has NO irregular-plural exception list,
  so it live-rendered "c h i l d + s / Most words just add s" for the seeded
  "Pick the correct plural of 'child'." mastery question (correct answer:
  children) — the figure doesn't just miss the topic, it actively ASSERTS the
  WRONG rule directly beside the correct MCQ option. A second live instance:
  "The plural of 'leaf' is:" (correct: leaves; same default-to-"+s" fallthrough).
  Filed as B1, 2026-08-28. NAMED RISK PATTERN: a deriver with a catch-all
  "else"/default branch (vs. the keyword-collision shape of bugs #1-4) is a
  DIFFERENT and arguably higher-severity risk — it never returns `null`, so it
  always asserts SOMETHING, confidently, even when wrong. Worth checking other
  derivers for the same "always-returns, no confidence gate" shape in a future
  run once B1 ships.
- 2026-08-28 (Scout, new correctness-ADJACENT class): also found a TOPIC/GRADE-BAND
  placement bug distinct from the visual-deriver class — `maths_algebra_linear`'s
  mastery pool contains "Expand (x + 2)(x + 3)." (produces an x² term), which is
  explicitly `maths_quadratics`' own subject matter (a near-identical question,
  "Expand (x + 5)(x − 2).", already lives there, one grade-band higher). The
  answer itself is correct — this is a categorisation bug, not an arithmetic one —
  but it means a child in a Grade 4-5 prerequisite topic meets Grade 5-7 content
  unannounced, and duplicates a skill two topics already separately claim to own.
  Filed as B3, 2026-08-28 (remove from `maths_algebra_linear`, orphan-delete the
  DB row — `maths_quadratics` already covers the skill). Worth an occasional
  broader sweep (not every run) for other cross-topic content leaks of this shape
  once B3 ships.

## EPIC 2 — Exam-style, command-word practice (make questions feel like the paper)
Status: ACTIVE (headline), zero-coverage closed, now purely a depth/variety lane.
Every KS4 topic across all three subjects has at least one command-word item
(confirmed shipped 2026-08-20).
- Next step: keep picking single-coverage topics each run and add a second
  command-word item (>= 2 per topic is the target) rather than re-sweeping the
  whole bank. Remaining single-coverage topics as of 2026-08-28 (after today's 3
  authored items land): eng_comprehension, eng_persuasive, sci_genetics,
  sci_ecology, eng_punctuation, eng_spelling, eng_poetry, eng_shakespeare,
  eng_creative, maths_graphs, sci_atoms — still a tail, pick 1-2 per run.
  `maths_fractions`, `maths_number`, `maths_geometry`, `maths_pythagoras`,
  `sci_electricity`, `maths_statistics` (now via a genuinely new sub-skill, not a
  rephrasing — combined/dependent probability, F2 2026-08-28), `maths_sequences`,
  `sci_cells` and `eng_devices` (all three via today's F4/F5/F6) are now past
  this bar.
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
  (Scout F1-F4): sci_genetics, sci_ecology, eng_punctuation, eng_spelling —
  SHIPPED 2026-08-20. 2 MORE authored 2026-08-22 (Scout F1/F2): maths_ratio and
  sci_body — SHIPPED 2026-08-22. maths_quadratics (factorising "Solve") authored
  2026-08-23 and SHIPPED 2026-08-24. 2 MORE authored 2026-08-26 (Scout F2/F3):
  maths_fractions (VAT "Calculate") and maths_number (standard form "Write") —
  SHIPPED 2026-08-26. Also 3 maths_geometry MASTERY-POOL BROADENING items SHIPPED
  2026-08-26 (see VARIETY note below). 2 MORE authored 2026-08-27 (Scout F3/F4):
  maths_pythagoras (trig "Calculate the angle") and sci_electricity (P = VI
  "Calculate the power") — SHIPPED 2026-08-28. 3 MORE authored 2026-08-28 (Scout
  F4/F5/F6): maths_sequences (nth-term back-solving "Work out"), sci_cells
  (microscope magnification "Calculate", AQA required-practical numeracy), and
  eng_devices ("Explain the effect" of a metaphor — the first EFFECT-analysis
  item on this topic, not just identification) — pending Mechanic transcription
  + seed. Also F2 2026-08-28: maths_statistics combined/dependent-event
  probability (tree-diagram-style, "Work out") — closes a genuine sub-skill gap
  (see EPIC 1 audit note), pending seed.
- VARIETY axis (2026-08-23, unblocked + SHIPPED 2026-08-26): command-word
  COVERAGE and question-bank VARIETY are different axes — maths_geometry had its
  2nd command-word item, but its small mastery pool served near-duplicate
  phrasings of the same fact ("hexagon interior angle") across separate mastery
  attempts, LIVE-REPRODUCED TWICE (2026-08-23, 2026-08-26). Three new mastery
  items shipped 2026-08-26 to give the pool real variety. Keep watching other
  topics under active spaced review (EPIC 5) for the same thin-pool symptom —
  none newly found 2026-08-27 or 2026-08-28.

## EPIC 3 — Full spec coverage: close missing GCSE topics
Status: ACTIVE. `maths_transformations` (Edexcel 1MA1 G7) SHIPPED 2026-08-28
(confirmed live via the admin Curriculum CMS: "Transformations · KS4 · Grade 3–5 ·
3 questions", all three authored prompts/answers present and correctly keyed).
Simultaneous equations authored this run (F1, 2026-08-28) as the next slice.
Required-practical recall/key equations (Science) and extract-based language
analysis (English) remain unscoped thin areas for a future run.
- Next step: seed `maths_simultaneous` (2026-08-28 F1 — topic entry + worked
  example + 3 checked starters, Edexcel 1MA1 A19/A20). After that, the two
  remaining named gaps are Science required-practical recall and English
  extract-based analysis — neither scoped into concrete authored content yet,
  worth picking up as a future run's headline curriculum item.
- Done so far: `maths_mensuration` + `maths_inequalities` strands shipped
  (2026-08-09/2026-08-20); mock unlock made a reachable count-driven floor
  (`lib/engine/mock-gate.ts`) so adding topics can't break the mock (F8,
  2026-08-09). `maths_transformations` authored 2026-08-27, SHIPPED 2026-08-28
  (topic entry + worked example + 3 starters, all live-confirmed via admin CMS).
  `maths_simultaneous` authored 2026-08-28 (topic entry + worked example + 3
  starters — one elimination, one substitution, one "which pair satisfies BOTH
  equations" verify-style mastery item) — pending seed.

## EPIC 4 — Exam-condition fidelity in the mock (rehearse exam day)
Status: ACTIVE. A real gentle countdown timer, marks/boundary-grade work, the
exam-boundary-grade reveal card, AND full question content for `fill_blank` items
pulled into a mock (EPIC 12) are ALL confirmed shipped and working live. Do not
re-propose a mock timer, the boundary-grade card, or the fill_blank mock-content
fix.
- Next step: nothing new identified this run specific to the mock itself — mock
  stayed correctly, honestly locked for Maths again this run ("You've done your
  Maths mock for this week... next one unlocks on 31 August"), confirming the
  once-per-period rule holds under a THIRD consecutive check. Keep re-verifying
  rather than re-proposing; EPIC 12 is the epic to extend if a future run finds
  another interaction type with the same generic-wrapper-prompt trap.
- Done so far: calculator vs non-calculator framing + readiness-tiered paper
  (F9, 2026-08-09); mark-weighted scoring + a warm, non-pass/fail boundary-grade
  reveal (F7, shipped 2026-08-14/18); calm countdown timer confirmed live
  (2026-08-18). 2026-08-26: full Maths mock end-to-end through the boundary-grade
  reveal; EPIC 12's fill_blank mock-content bug SHIPPED + re-verified the same
  day.

## EPIC 5 — Retention that reaches exam day (spaced repetition + interleaving)
Status: ACTIVE (largely complete on both sides now). Spaced-rep warm-up + readiness
trajectory schedule deterministically from certification dates/scores (non-profiling).
- Next step: nothing new identified this run. Keep re-verifying each run rather
  than re-proposing; if a genuinely new gap appears, log it here.
- Done so far: warm-up interleaves across subjects (`interleaveDueReviews`, F10
  2026-08-09); the spacing curve widens — a correct recall doubles the interval
  (capped 90 days), an incorrect one resets to 7. Warm-up re-verified live
  end-to-end 2026-08-14, 2026-08-19, 2026-08-26, 2026-08-27, and again 2026-08-28
  (a genuine 3-subject interleaved warm-up: fractions correct, grammar wrong with
  a calm nudge, biology correct). The "N reviews due" count on the dashboard is
  correctly a total-backlog figure, NOT a promise the warm-up will surface all N
  in one sitting — the warm-up deliberately caps at 3 questions per session by
  design (matches its own "3 quick questions" copy); confirmed this is intentional
  scope, not a mismatch, before considering filing it as a bug.

## EPIC 6 (background) — Calm, confident child experience (delight within the calm-wrong law)
Status: ONGOING background lane, not gated to a night. Every interaction type
(mcq, fill_blank, tap_reveal, drag_drop) now has BOTH a correct settle and a
wrong settle. The mock-exam answer-pick pulse and the reflection-confirmation
entrance (F6, 2026-08-27) are also SHIPPED — do not re-propose.
- Next step: F7 (2026-08-28) — the certificate page (`/learn/certificate`) is now
  the one remaining "arrival" moment in the child flow with literally zero motion
  (confirmed live twice this run: renders the whole article instantly, fully
  formed). A gentle scale/fade entrance (matching the calm, un-hurried pace
  everywhere else) would close this out.
- Done so far: every interaction type has its own correct-answer settle
  (2026-08-09); warm hint-card entrance + calm See-it beckon on a miss
  (2026-08-09); calm guiding glow + supportive fill_blank wrong-settle
  (2026-08-11/12); a one-shot settle pulse on phase-bar activation (2026-08-18);
  tap_reveal/drag_drop wrong-answer settle motion (2026-08-18); drag_drop chip
  pick-up lift + a reactive Eddie face on the practice panel (2026-08-19); the
  See-it panel fully collapsing after a correct mastery answer (2026-08-23,
  re-verified 2026-08-26/27); tap_reveal's reveal/select gesture split
  (re-verified 2026-08-26/27/28 — this run's `eng_devices` tap_reveal question);
  Eddie on the mastery reteach screen (shipped 2026-08-24, re-verified live
  2026-08-26/27/28 — this run deliberately failed a `maths_algebra_linear`
  mastery attempt 2/3 and confirmed Eddie's presence on the reteach card again);
  the mock-exam pick pulse (2026-08-26, still gate-verified only — the mock has
  been honestly locked every check since, a quota-timing constraint, not a bug);
  the reflection-confirmation entrance (F6, shipped 2026-08-28 per yesterday's
  batch — not separately re-driven live this run, gate-verified only, matching
  the established precedent for this class of expensive end-state).

## EPIC 7 (background) — Stay on the current stack + performance budget
Status: ACTIVE. React 19 and Tailwind 4 are already current; `tailwind-merge`,
`lucide-react`, and several patch/minor deps (mongodb/stripe/jose/@sentry/nextjs/
@upstash/redis/@axe-core/playwright, shipped 2026-08-28 per yesterday's F7) are
now ALSO current. Next.js, the framer-motion→motion rename, and eslint 10 remain
a further major behind.
- Next step: eslint 10 stays BLOCKED on the Next.js 15→16 migration (peer-dep cap
  confirmed 2026-08-24) — read the official upgrade guide first, this repo relies
  on specific caching/route-group behaviour. Pair the nonce-based CSP hardening
  with that move (CSP still uses `'unsafe-inline'` for script-src, reconfirmed
  live 2026-08-28 via `curl -IL` — still correctly blocks arbitrary third-party
  script origins). SEPARATELY: another small batch of in-range ("Wanted") bumps
  is available as of 2026-08-28 — `next` 15.5.23→15.5.24, `@next/bundle-analyzer`
  15.5.18→15.5.24, `@types/node`, `lucide-react` 1.34→1.35, `posthog-js`
  1.386→1.422 — filed as F8, 2026-08-28, routine and independent of the Next 16
  staged migration.
- Done so far: hero LCP fix + LazyMotion split + ReducedMotionProvider (shipped
  2026-08-12/15); `@next/bundle-analyzer` added, killed an eager lucide-react
  barrel-import chunk (2026-08-18); audit stays at 0 vulnerabilities (re-confirmed
  2026-08-28, both prod-only and full tree). `@axe-core/playwright` wired into a
  real CI a11y job (2026-08-19). `tailwind-merge` v2→v3 and `lucide-react` v0→v1
  (2026-08-24); mongodb/stripe/jose/@sentry/nextjs/@upstash/redis/
  @axe-core/playwright/tsx/vitest bumped to their in-range "Wanted" versions
  (2026-08-28, per yesterday's F7 — live-confirmed via the Sentry SDK version
  string in captured envelope requests).

## EPIC 8 — Mobile layout regressions: sweep the bare `grid` pattern
Status: RETIRED as an active risk 2026-08-19. Re-confirmed clean again
2026-08-20, 08-23, 08-26, 08-27, and 08-28 (mobile 390px pass across the hub, the
dashboard, and a lesson page — `scrollWidth` 380 ≤ `innerWidth` 390 on every
screen checked). Re-open only if a future run finds a concrete overflow repro,
don't re-sweep speculatively.

## EPIC 9 — A visual mascot for Eddie
Status: ACTIVE, v1 SHIPPED 2026-08-19, present at every scoped call site.
`EddieAvatar` (self-hosted SVG/CSS, no Lottie/CDN, mood-driven off signals
already computed) is live on the practice-player correct/wrong panel, the See-it
coach, my-stuff voice preview, the Topic-mastered completion screen, AND the
mastery reteach screen — all re-confirmed live again 2026-08-28 (a fresh
certification's Topic-mastered screen, and a deliberately-failed mastery
attempt's reteach screen, both showed Eddie).
- Next step: nothing new identified this run — consider this epic's build-out
  essentially complete; keep the standing re-verify-don't-re-propose posture.
- Done so far: v1 (2026-08-19); See-it coach + my-stuff voice preview
  (2026-08-20); Topic-mastered celebrating/encouraging moods (2026-08-22); Eddie
  sized up on Topic-mastered + added to the reteach screen (2026-08-24,
  re-confirmed live 2026-08-26, 08-27, and again 08-28).

## EPIC 10 — SEO/metadata hygiene sitewide
Status: SHIPPED 2026-08-20, no known open gap. Standing every-run spot-check
(cheap via curl) rather than an active work item; re-open only on a concrete
regression.

## EPIC 11 — Dashboard "today" surface conflates weekday-empty with plan-absent
Status: SHIPPED 2026-08-24, RE-VERIFIED LIVE 2026-08-26, 08-27, and again 08-28
(approved a fresh Sam Test week this run — the dashboard card immediately
switched from "Sam doesn't have a plan yet" to the real assigned topic; holds on
a THIRD different child across three separate runs). No further action; re-open
only on a concrete regression. NOTE: this is a DIFFERENT bug shape from EPIC 14
(new, below) — EPIC 11 was "no plan exists yet"; EPIC 14 is "a plan exists and
was actioned, but the done-flag never looks at overall certified state".

## EPIC 12 — Mock-exam questions must carry their FULL content, not just `prompt`/`options`
Status: SHIPPED 2026-08-26, RE-VERIFIED 2026-08-26. `buildMockPaper` now
synthesises a self-contained mock prompt for `fill_blank` items. No further
action; re-open only if a future run finds another interaction type
(`tap_reveal`/`drag_drop`) with the same generic-wrapper-prompt trap in a live
mock.
- Done so far: fix shipped + verified. Broader spot-check (every non-mcq question
  in every subject's mock actually reads as complete) not yet done as a dedicated
  pass — worth a future run once a mock naturally unlocks for a subject with a
  `tap_reveal`/`drag_drop` item in its practice/mastery pool.

## EPIC 13 — `certified_at` must not move on a re-mastery of an already-certified topic
Status: SHIPPED 2026-08-28 (Mechanic), RE-VERIFIED LIVE 2026-08-28 (Scout) via a
GENUINE re-mastery, not just a DB read — re-certified Ivy's already-certified
`maths_algebra_linear` (deliberately failed one mastery attempt 2/3 first to
also re-confirm the reteach screen, then passed 3/3 on a fresh attempt) and
confirmed the certificate still reads "Awarded 26 August 2026", completely
unchanged from before this run's re-take. No further action; re-open only on a
concrete regression.
- Done so far: `resolveCertifiedAt`/`isFreshCertification` extracted into
  `lib/engine/competence.ts` (unit-tested); `upsertCompetence` now only sets
  `certified_at` on a genuinely fresh certification. Confirmed both by code
  (2026-08-27 Mechanic) and now by a real live re-take (2026-08-28 Scout) — the
  strongest possible verification for a data-integrity fix.

## EPIC 14 (new) — Dashboard "today's quest" done-flag ignores overall certified state
Status: NEW, opened 2026-08-28. `todayCard` (`src/lib/db/repo.ts:1763-1837`)
computes each quest's `done` flag from `todaysCompletedTopicTags` — completions
strictly TODAY — and never cross-references the topic's actual `CompetenceDoc`
state, even though `comps` (the full competence list) is already fetched in the
same function for other purposes. A topic certified on any PRIOR day (yesterday,
or earlier in the week before the plan was last edited) stays "not done" for
every subsequent day the weekly plan still lists it, so the dashboard shows a
stale, misleading "N quests left today" and an unchecked, clickable row for
already-mastered work. Live-reproduced on Ivy's real dashboard this run — her
`eng_ks3_reading` (Inference & Language), certified yesterday, was still listed
as her one outstanding quest today, while her OWN child hub (computed
independently and correctly) showed a different, real next topic. Filed as B2,
2026-08-28.
- Next step: ship B2's fix — add `certifiedTags` (from the already-fetched
  `comps`) alongside the existing `pausedTags`, and OR it into the `done`
  computation. Live-verify on Ivy's dashboard that the stale row disappears
  (checked/strikethrough, or the card reaching its "All done" state).
- Done so far: nothing shipped yet — fresh epic from today's live Playwright
  drive (not a code-only audit finding this time — reproduced by simply looking
  at the parent dashboard immediately after the standard child-mode lesson pass).

## EPIC 15 (new) — Cross-topic content/grade-band leaks in the seed data
Status: NEW, opened 2026-08-28. Distinct from EPIC 1's derived-VISUAL
correctness class — this is about a seed QUESTION itself sitting under the wrong
topic_tag. `maths_algebra_linear` (Grade 4-5, "linear equations and rearranging
formulae") contains a double-bracket expansion question that produces an x² term
— explicitly `maths_quadratics`' (Grade 5-7) own subject matter, which already
tests the identical skill with a different worked example. Filed as B3,
2026-08-28.
- Next step: ship B3 (remove the line from `maths_algebra_linear`'s array,
  orphan-delete the DB row on its natural key — `maths_quadratics` already
  covers the skill, no replacement needed). Once shipped, this epic's "next
  step" is an occasional (not every-run) broader sweep for the same shape
  elsewhere in the bank — not urgent enough to justify a dedicated pass yet with
  only one confirmed instance.
- Done so far: nothing shipped yet — fresh epic from today's live re-mastery
  drive of `maths_algebra_linear` (the same session that re-verified EPIC 13).
