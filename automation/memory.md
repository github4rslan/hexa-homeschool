# Automation memory (Scout + Mechanic self-improvement log)

Both agents read this at the start of every run and append to it at the end.
It's how the loop compounds: taste the owner has shown, patterns that worked,
mistakes not to repeat. Keep entries short and dated. Newest at the bottom.

## Owner preferences (accepted / rejected patterns)
- **F4 (TOTP 2FA) is DONE and shipped** (owner had the assistant finish + commit
  the previously-uncommitted WIP). The tree is clean again — no 2FA WIP to avoid.
- **Live tutoring/scheduling stays deferred** (architecture decision). The owner
  chose to build F9's tutor-availability toggle anyway, but keep it *advisory
  self-status only* — do NOT build live matching/booking/calendars.

## Things that broke (do not repeat)
- (empty)

## Patterns that worked (repeat these)
- **Reuse the existing TTS cache for any new audio (F6).** `/api/tts` is
  session-gated, per-user rate-limited, and Cloudinary-cached by a sha256 of
  `model:voice:speed:settings:text`. New audio features just POST deterministic
  text to it (no new route, no new cost on repeat plays). Build the narration as
  a PURE function in `lib/engine/*` (unit-testable) and let a small client
  component fetch+play with idle/loading/playing/error states; degrade to a
  friendly message on 503/403 (ElevenLabs/billing unset) — never a dead control.
- **Hand-rolled service worker beats adding @serwist for a minimal PWA (F5).**
  A ~90-line `public/sw.js` (version-tagged cache, cache-first static assets,
  network-only navigations with an `offline.html` fallback) + a tiny
  `PWARegister` client (prod-only, best-effort) + a dashboard `beforeinstallprompt`
  banner passed the gate with zero new deps and no next.config churn. CSP already
  allowed `worker-src 'self' blob:`. Compliance: the SW NEVER caches HTML/API
  (parent+child PII) — only immutable static assets — so the distress gate +
  Checker always run server-side. Register in the ROOT layout (SW scope is
  origin-wide regardless of where you register).

## Blocked-by-owner-WIP (recurring constraint)
- RESOLVED (2026-07-22) — the 2FA WIP that was blocking `repo.ts`/`types.ts` is
  committed (F4 shipped), so those files are editable again. No active WIP block.

## Run log
- 2026-07-23 — Mechanic build run, DECISION `all` (owner named F1, B1, B2, F2 — 4 of
  4, within cap). SHIPPED, each green-gated (type-check + tests + lint + build, one
  commit, pushed to main) AND live-verified on edway.uk with Playwright:
  **B1** practice actions row `flex-wrap` at 390px (measured scrollWidth 380 ≤ 390,
  was 416 — overflow gone). **B2** quest dead-wall: new pure
  `pickPlayableQuestTopic`/`pickScheduleQuestTopic` (+ tests) + repo
  `resolveDailyQuestTopic`/`playableTopicTagsInBand`; the child hub now resolves each
  subject to an in-band topic that actually has questions, else a calm "coming soon"
  card. Live: Science quest resolved to `sci_ks2_living` and opened a real lesson (no
  "isn't ready yet"). **F1** (owner priority) `fraction_bars` teaching-animation type
  end-to-end: `deriveFractionSum` parses `a/b ± × c/d` incl. vulgar glyphs (¾ ⅛) →
  common-denominator/combine/simplify/answer steps; pure `fractionBarsSpec`;
  `FractionStage` shaded-bar renderer; fraction speech ("6 eighths plus 1 eighth
  equals 7 eighths"). Live on the owner's `¾ + ⅛` screen: See-it showed 6/8 + 1/8 =
  7/8 shaded bars with correct narration. **F2** deterministic animated question
  figure (`deriveMathVisual` → shaded fraction bar / 10×10 percent grid, real alt),
  replacing the AI PNG when derivable, AI fallback otherwise. Live: the ¾+⅛ figure
  rendered "Two fraction bars: 3 of 4 parts shaded, added to a bar with 1 of 8 parts
  shaded." NOT built (remaining, per cap): B3 favicon-32 404 (confirmed still logging
  on every page — the ONLY console error seen, safe one-liner for next run), B4
  equal-value MCQ distractors (needs seed), F3 correct-option settle micro-anim, F4
  mastery phase bar, F5 npm-audit CVE bumps. Patterns: (1) a new animation TYPE is
  end-to-end but low-risk because normalizeTeachingAnimation is a fallback chain and
  the AI path is generic over TeachingAnimationType — no exhaustive switches to break.
  (2) Extract quest/selection ordering into a pure `lib/engine|lib/child` helper so
  the DB-bound repo change still gets unit tests. (3) The MCP browser profile PERSISTS
  login between runs (login form was pre-filled); `/logout` is POST-only (GET = 405) —
  log out with a `fetch('/logout',{method:'POST'})` from the page, then browser_close.
- 2026-07-23 — Mechanic build run #2 (owner named B3, B4, F3, F4 — 4 of 4, within
  cap; F1/B1/B2/F2 already shipped, F5 left for next run). All four SHIPPED, each
  green-gated (type-check + 555 tests + lint + build, one commit, pushed to main)
  AND live-verified on edway.uk with Playwright. **B3** favicon-32 404: `public/`
  only had `favicon.svg`; generated the missing PNGs from it with **sharp 0.34.5**
  (already a dep) — favicon-32, apple-touch-icon(180), icon-192/512 + a full-bleed
  maskable-512 (logo at 70% on #050614). Fixes the head icon 404 AND the latent PWA
  manifest icon 404s. Live: all five PNGs return 200 image/png; ZERO console errors
  on dashboard + child mode (favicon-32 was the only one). **B4** equal-value MCQ:
  the ⅔×¾ mastery Q had 6/12 and 2/4 (both = 1/2) as distractors. KEY GOTCHA: seed
  upserts questions by natural key `topic_tag + prompt`, so rewording the prompt
  would INSERT a new row and ORPHAN the old — instead I kept the prompt and only
  swapped the distractors (→ 7/12, 5/8; kept 5/7 add-across error) so exactly one
  option equals 1/2. Ran `npm run seed` (idempotent, upsert-in-place, only touches
  curriculum_topics/questions + indexes, never child/parent data) to push it live;
  "7 written". Live-verified by a read-only DB query: options now
  ["1/2","5/7","7/12","5/8"], correctIndex 0. (The Q is KS3 fraction mastery, out of
  band for the KS2 smoke child Ivy, so DB read was the authoritative live check.)
  **F3** correct-answer settle micro-anim in `interaction.tsx` Mcq: accent
  fill-sweep (scaleX 0→1 origin-left, settling opacity 0.35→0.18, `accent.bar`
  gradient) + a self-drawing check (`motion.path` pathLength 0→1, d="M5 13l4 4L19 7"),
  gated on `celebrate = showCorrect && wasCorrect && chosen` so ONLY the child's own
  correct pick gets motion; wrong stays soft dim/desaturate; reduced-motion collapses
  to static tint + instant check. Button needed `relative overflow-hidden` + inner
  content wrapped in `relative z-10` so the sweep clips behind text. Live: chose the
  correct option, DOM confirmed overflow-hidden + neon border + gradient sweep span +
  the drawn-check path; screenshot showed the teal→violet sweep across the option with
  "Brilliant!". **F4** real third "Mastery" phase-bar segment: `PracticePlayer` now
  lifts its internal sub-phase via `onPhaseChange` (a `useState` setter — stable
  identity, so the reporting effect only fires on real phase change), and `DailyFlow`
  renders a 3rd segment (Learn→Practise→Mastery), lighting it when subPhase ∈
  {mastery,reteach,handoff,complete} via the existing motion.div width animation. Live:
  drove 3/3 practice correct → "Start mastery" → landed in "Mastery check 1"; all three
  segments filled (216px) with the active fog-200 label — the segment exists AND lights
  on crossing. Patterns worth repeating: (1) generate missing static icon assets from
  an existing SVG with the already-installed `sharp` rather than adding tooling — script
  must run from the PROJECT dir (scratchpad can't resolve `sharp`); copy the .mjs into
  repo root, run, delete. (2) When editing a seed question, NEVER change the `prompt`
  (the natural key) or reseed orphans the old row — mutate options/answer in place. (3)
  To live-verify content behind a deep/out-of-band lesson flow, a read-only Mongo query
  is a legitimate authoritative check. (4) Lift child-component sub-state to a parent
  bar via a `useState` setter passed as the callback — no useCallback needed, identity
  is already stable. MCP browser did NOT persist login this run (had to sign in via the
  autofilled form); `/logout` POST + browser_close for teardown as before.
- 2026-07-22 (earlier entries below)
- 2026-07-20 — System created. Scout runs by day (discovery), Mechanic by night
  (implementation). Default DECISION is `all`. Production target: https://edway.uk.
  Experiment stage: no real users yet — bias toward ambitious features.
- 2026-07-20 — First discovery pass. Focus: live-site journey walk + auth/money/
  silo bug hunt + ambitious feature lanes. Codebase is mature and well-hardened
  (CSP/Permissions-Policy are route-scoped and correct; billing webhook idempotent
  + price-derived; ownership checks clean; type-check/lint green). Best finding: the
  login page links to `/forgot-password` but no reset flow exists at all (404 +
  console error) — B1/F1. Pattern noticed: the marketing site is polished but has
  small content-truth slips (a "5%" stat that should read 100%) and a couple of
  never-wired links/params (login drops its own `?redirect=`) — worth grepping for
  dead routes/params each run. Static: 5 npm-audit CVEs open; Tailwind still on
  4.0.0-beta.8 in prod.
- 2026-07-20 — Second pass, AUTHENTICATED surfaces (parent/child/admin/tutor via
  test accounts). Data-silo holds under every role (tutor saw only an empty parent
  shell, no cross-family data). New findings merged into today's report: B4 — child
  mode's Maths quest is a silent dead-end (lesson page `redirect("/learn")` when a
  topic has zero playable questions, while other topics load), contradicting the
  recent "no dead ends" work; B5 — role-blind routing (middleware bounces every
  authed user to `/dashboard`; parent routes aren't role-gated, so tutors/admins
  load the parent shell — `/tutor` and `/admin` DO gate correctly); B6 settings
  password forms miss username/autocomplete; B7 active subscriber still sees
  "14-day free trial" + admin "1 accounts". New feature: F8 inline child switcher on
  `/schedule`+`/tutoring` (portfolio already has one; active-child is buried in the
  hamburger). Pattern: parent per-child surfaces are inconsistent about *which*
  child they act on, and child-mode dead-ends hide behind seed/keyStage gaps —
  worth tapping an actual lesson each run, not just eyeballing the hub. Admin/finance
  panels are honest ("Illustrative — not live" labels). Static unchanged: type-check
  + lint clean, 5 npm-audit vulns, Tailwind still on beta.
- 2026-07-21 — Mechanic build run, DECISION `F5, F6, F7, F9` (4 of 4, within cap).
  SHIPPED (each green-gated: type-check + 524 tests + lint + build, one commit,
  pushed to main): **F5** installable offline-resilient PWA (hand-rolled `sw.js`
  + `offline.html` + `PWARegister` in root layout + dashboard `InstallPrompt`);
  **F6** parent weekly audio recap (pure `buildWeeklyRecapNarration` + 4 unit
  tests, `WeeklyRecapPlayer` on the dashboard week-in-review card via the cached
  `/api/tts`, + a digest-email mention); **F7** `prefers-reduced-motion` in
  marketing `CountUp` (JS-gated, since rAF ignores the CSS query) + `StatsStrip`
  fades. BLOCKED: **F9** tutor workspace — already largely built on main; the
  remaining pieces need repo.ts/types.ts which hold the owner's 2FA WIP (see the
  constraint note above). Note for the owner: once you commit the 2FA WIP, F9's
  availability setting + notes-on-child-dashboard are the clean next slice. B1–B7
  bug lane + F1/F2/F3/F8 were already on main before this run; F4 left untouched.
- 2026-07-22 — Owner-directed manual build (assistant, not the cron). Completed +
  shipped **F4 TOTP 2FA** (finished the long-uncommitted WIP: crypto/storage were
  done; wired login enforcement → /login/totp verify page + action, settings
  enrolment/confirm/recovery-codes/disable, hashRecoveryCode + test). Then shipped
  **F9 tutor workspace** slice: tutor availability self-status toggle + parent-
  facing tutor-notes card (ownership-checked listChildTutorNotes). Both green
  (type-check, 525 tests, lint, build), one commit each. Pattern: a "use server"
  module may export only async fns — put shared consts (e.g. a cookie name) in a
  sibling non-action file. All of Scout's 2026-07-20 report is now shipped.
- 2026-07-22 — Discovery pass, OWNER PRIORITY = child-mode lesson animation features
  + bug fixes, led by the fraction lesson (`/learn/lesson?topic=maths_fractions`).
  Walked the fraction lesson end-to-end as Sam (KS3): explainer → 4 practice →
  3/3 mastery → certified; correct = star burst, wrong = calm no-red, hints +
  See-it + trophy all PASS. Key insight: the child flow is ALREADY animation-rich
  (framer-motion everywhere, Celebration, choreographed See-it teaching-animations
  for equations/grammar/science/choice, Eddie coach, karaoke captions, breath
  break, reduced-motion + WCAG throughout) — so the real gap is CONTENT-SHAPED:
  fraction/percentage questions have NO fraction visual (they fall through every
  deriver in teaching-animations.ts to the generic choice_strategy text panel).
  Headline feature = F1 a `fraction_bars`/area-model animation type. Bugs found:
  B1 practice actions row ("I'm stuck"+"Check answer") overflows 26px at 390px
  (row lacks flex-wrap); B2 today's Science quest (`science_biology_cells`, also
  on the parent dashboard today-card) dead-walls into the calm "isn't ready yet"
  screen — advertised but unseeded; B3 favicon-32.png 404 on every page. Static:
  type-check + lint green; npm audit now 5 vulns (4 high sharp/libvips, moderate
  postcss) — do NOT `audit fix --force` (downgrades next→9). Prior F1 password
  reset shipped (login "Forgot password?" → /forgot-password works). Pattern:
  when the owner asks for "more animation", first inventory what already animates
  — here the win was a missing VISUAL TYPE, not more motion on existing surfaces.
- 2026-07-25 — Discovery pass. OWNER PRIORITY = verify the reworked child help flow
  ("See it" gates after 2 wrong, "I'm stuck"+worked-example removed, cap reveals
  answer+See-it). Drove Maths KS2 arithmetic end-to-end as Ivy: **PASS, no
  regression** — wrong#1 calm nudge (no See-it/no I'm-stuck, "2 tries left"),
  wrong#2 See-it unlocks ("1 try left"), See-it opens Eddie walkthrough, cap
  reveals correct option (green border+check, wrong pick dimmed never red) +
  "Keep going" (never stranded), correct=celebration, mastery 3/3=certified.
  Mobile 390 no overflow (prior B1 flex-wrap holds). All 3 subjects playable, no
  dead-walls; mocks gated at 10 certified (honest lock). Site is clean: ZERO
  console errors across marketing/dashboard/child/admin; type-check+lint green;
  /api/health 200. Findings are modest (mature codebase): best = F1 twelve
  marketing pages have NO <h1> (top heading is h2 — SEO/a11y, curl-verified),
  F2 five high npm-audit CVEs (postcss via next + sharp<0.35; fix WITHOUT
  --force), F3 multiplication-array math visual (extends accepted fraction-bars
  pattern). Bugs all Low: B1 dashboard "avg lesson time … within 45–60 min
  target" hardcoded (shows "3m · within 45–60 min target"), B2 double name
  greeting, B3 raw ISO "WEEK OF 2026-07-20" on /schedule. COVERAGE GAP: tutor
  surface untested — TUTOR_EMAIL/PASSWORD absent from .env.local (seed:test-accounts
  aborts without them). Pattern: curl -sL against www (apex→www redirect eats
  bare curl) is a fast way to audit <h1>/meta across all static pages at once.
