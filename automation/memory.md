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
- **`npm audit fix` (non-force) does NOT clear the next/postcss/sharp highs** as a
  2026-07-26 finding claimed — it only bumped next 15.5.20→15.5.22 and still
  offered `--force` (→ next 9, forbidden). The real fix: pin the NESTED deps via
  npm `overrides` (`"postcss": "$postcss"` + `"sharp": "^0.35.0"`) → resolves
  8.5.23 / 0.35.3 and clears all 5 targeted advisories with next staying on the
  15.5 backport line. GOTCHA: an override for a pkg that's ALSO a direct dep must
  match the direct spec or use `$name` (else `EOVERRIDE`) — so I also bumped the
  direct devDep postcss to `^8.5.18`. Verify sharp with a raw `require('sharp')`
  render (NOT `require('sharp/package.json')` — 0.35 drops that export → false
  failure). Residual 9 highs are dev-only `brace-expansion`/`minimatch` DoS
  (GHSA-mh99-v99m-4gvg, range `<=5.0.7` covers ALL published versions ⇒ no fix
  exists yet) via the eslint + @sentry/bundler toolchain — never in the prod
  runtime; overriding brace-expansion did NOT help, so I left it out.

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
- 2026-07-25 — Mechanic build run, DECISION `all` (owner named B1, B2, B3, F1 — 4 of
  4, within cap). All four SHIPPED, each green-gated (type-check + tests + lint + build,
  one commit, pushed to main) AND live-verified on edway.uk. **B1** dashboard "Avg
  lesson time" false-reassurance: extracted a pure `avgLessonTimeHint(avgSec)` (+ test)
  → below/within/above the 45–60 min band; live card now reads "4m · below the 45–60
  min target" (was hardcoded "within … target"). **B2** double name greeting: passed
  `firstName={null}` to `TodayBriefingHeader` so the personalised name lives only in the
  topbar; live shows "Good to see you, Scout" (topbar) + "Good evening" (briefing, no
  name). **B3** raw ISO week key: new pure `formatUkDate(iso)` in `lib/utils.ts` (+ test,
  UTC-anchored so the day never shifts) → live "/schedule" reads "Week of 20 July 2026".
  **F1** every marketing page a real `<h1>`: added an `as?: "h1"|"h2"` prop to the shared
  `SectionHeader` (default h2, identical Tailwind classes — only the tag changes) and set
  `as="h1"` on the FIRST header of the 12 pages that led with an h2 (pricing, how-it-works,
  safety, for-parents, agents, demo, compliance, roadmap, resources, gallery, why-now,
  contact). Live curl across all 16 marketing pages: each now has EXACTLY one h1 — the 4
  pre-existing ones (/, /about, /childrens-code, /local-authorities) did NOT double. Zero
  console errors on dashboard/schedule. Patterns worth repeating: (1) The MCP browser
  profile PERSISTED the login *form autofill* this run — the SMOKE email+password were
  pre-filled on /login, so I just clicked "Sign in" and never had to type/print the
  password (privacy-clean login). Teardown: `fetch('/logout',{method:'POST'})` → 200, then
  browser_close. (2) For a shared heading component used in multiple sections per page,
  add an `as` prop (default the section level) and opt the lead header into h1 per-page —
  never blanket-flip the component or you get multiple h1s. (3) `curl -sL` h1 counts across
  all marketing routes is a fast, authoritative live check for the F1-class SEO/a11y fix —
  poll it in a loop to confirm the Vercel deploy actually landed before asserting (deploy
  took ~75s this run). NOT built (remaining, per cap): F2 (npm-audit CVEs — sharp bump +
  non-force audit fix), F3 (multiplication-array math visual), F4 (dyslexia reading mode),
  F5 (mastery certificate), F6 (annual billing toggle), F7 (dashboard skeletons). NOTE: the
  cron's stale "never build F4/2FA" line is OBSOLETE — 2FA shipped long ago; today's F4 is
  dyslexia reading mode, just out of scope under the 4-item cap.
- 2026-07-26 — Mechanic build run, DECISION `all` (owner named B1, B2, F2, F6 — 4 of
  4, within cap). All four SHIPPED, each green-gated (type-check + tests + lint +
  build, one commit, pushed to main) AND live-verified on edway.uk with Playwright.
  **B1** `week-in-review.tsx:58` pluralization: inline `${n} lesson${n===1?"":"s"} ·
  ${c} topic${c===1?"":"s"} certified` (adds the missing "topic(s)" noun too). Live:
  parent dashboard card now reads "2 lessons · 2 topics certified · 20 July – 26 July"
  (data moved to 2 since Scout saw 1; the new "topics certified" phrasing confirms the
  fix is live; singular path is unit-logic + local-verified). **B2** `/login` subtitle
  "parent account"→"Edway account" (shared tutor/admin sign-in). Live: page renders
  "Sign in to your Edway account." **F2** cleared the 5 targeted high CVEs
  (next/postcss/sharp/fast-uri) — see the "Things that broke" note for the overrides
  recipe. No user-facing surface (dep bump); gate-verified + no-regression: authed
  dashboard zero organic console errors, sharp-generated PNGs 200, sharp render smoke
  passed. **F6** monthly/annual billing toggle on `/pricing`: new `BillingInterval` in
  `lib/billing/stripe.ts` — `priceIdForTier(tier, interval)` reads
  `STRIPE_PRICE_{STANDARD,FAMILY}_ANNUAL`, `annualBillingConfigured()` gates the UI,
  `tierForPriceId` now also matches annual ids so the price-derived webhook is
  unchanged; checkout route takes `&interval=annual`; a client `PricingPlans` renders
  the segmented toggle (2 months free = 17%) + cards. Live (annual price ids NOT set on
  prod, as expected): toggle HIDDEN, prices £49/£99 monthly, CTAs `?tier=standard|family`
  with no interval, and BOTH "17%" copy lines gated OFF — clean degradation, no broken
  promise. Patterns worth repeating: (1) to fix a transitive/nested CVE without a real
  patched release of the PARENT pkg, `overrides` the nested dep to a patched version and
  keep the parent on its security-backport line — don't `--force` a major downgrade. (2)
  Gate a marketing feature (and its promotional copy) behind a server-read env check
  (`annualBillingConfigured()`) and pass a boolean into a `"use client"` component — the
  page stays static, degrades to a truthful monthly-only view when unprovisioned. (3) MCP
  browser profile STILL persists the SMOKE login-form autofill (session cookie expired, but
  email+password pre-filled — one click to sign in, no typing/printing the password);
  teardown `fetch('/logout',{method:'POST'})`→200 then browser_close, as always.
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
- 2026-07-26 — Discovery pass, FULL coverage restored (tutor/admin/child creds all in
  .env.local this run). Took the Maths KS2 lesson end-to-end as Ivy (Learn→Practise
  3/3→Mastery 3/3→certified): wrong#1 calm name-nudge/no-red/2-left, wrong#2 See-it
  unlocks/hints escalate/1-left, correct=star burst, mock honestly gated (2/10). English
  + Science playable; admin (4 sub-pages) + tutor console both READ-ONLY clean; tutor saw
  only an empty "No sessions assigned yet" queue (silo holds). ZERO console errors on EVERY
  surface, no 390px overflow anywhere. Prior fixes verified live-shipped: 2026-07-25 B1/B2/B3
  (avg-time honest, single greeting, "WEEK OF 20 JULY 2026"), settings pw autocomplete,
  finance no "1 accounts". KEY: carried-over **F4 dyslexia reading mode is now SHIPPED** —
  My-stuff has a full Easier-to-read suite (easy-read font, text size, reading ruler, colour,
  read-aloud); dropped it. Findings modest (very mature codebase): only NEW bug = B1
  "1 lessons · 1 certified" pluralization in `week-in-review.tsx:58` (helper `plural()` already
  exists in weekly/daily-summary — reuse); B2 login says "parent account" on a shared
  tutor/admin sign-in. Re-included still-valid carryovers F2 (npm audit now 5 high: next+postcss+
  sharp+fast-uri, NON-force fix now available), F3 (math visual — broadened to include the
  "½ of 16" fraction-of-amount case, whose See-it is still the generic strategy panel), F5
  (mastery certificate — cert screen has no download, confirmed live), F6 (annual billing —
  17% still promised ×2, monthly-only checkout), F7 (skeletons — "Loading…" flash on dashboard
  AND lesson). New ambitious: F8 spaced-repetition "Daily review" quest (next_review_at already
  stored, never resurfaced to child), F9 in-lesson tap-to-define glossary (SEND/EAL, human-authored).
  Static: type-check+lint green, security headers all strong (CSP/HSTS-2yr/X-Frame-DENY/nosniff/
  Permissions-Policy), stack current (Next 15.5.18, React 19, Tailwind 4.3.3 off beta). Pattern:
  MCP profile persists the SMOKE login form autofill (parent = one click, no typing); for
  admin/tutor you must clear+fill the fields; `/logout` POST between account switches + browser_close.
- 2026-07-27 — Discovery pass, FULL coverage (parent/child/admin/tutor). Took the **Maths KS3
  negatives** lesson end-to-end as Ivy (she cross-band progressed: age 10 but Maths band now KS3,
  Year 7 "Negative Numbers & Powers", having certified all KS2 Maths) — Learn→Practise 3/3→Mastery
  3/3→certified: wrong#1 calm name-nudge/no-red/2-left, wrong#2 See-it unlocks/hints escalate/1-left,
  correct=star burst, phase bar (Learn→Practise→Mastery) lights per stage. English+Science playable,
  admin (overview+finance) + tutor console READ-ONLY clean, tutor saw empty queue (silo holds). ZERO
  console errors on EVERY surface, no 390px overflow anywhere (all sw 380≤390). Findings modest (very
  mature codebase): NEW bugs all admin-facing/low — B1 admin "Recent learning activity" prints raw
  topic slugs ("Maths Ks3 Negatives") via `topic_tag.replace(/_/g," ")` at admin/page.tsx:99 instead
  of curriculum title; B2 admin metric hint "completed sessions" (banned glossary synonym) at
  admin/page.tsx:61; B3 /favicon.ico 404 on raw JSON responses (only /api/health etc — app pages
  declare svg/png icons, so 0 errors there; no root favicon.ico exists). Re-included carryovers
  F3 (math figures — CONFIRMED live: negatives explainer describes a number line but renders only a
  text chip; "5−8" practice fell to a generic placeholder img with weak alt "Helpful visual for this
  mathematics question"; math-visual.ts only derives fraction+percent today), F5 (mastery cert — cert
  screen still no download), F7 (skeletons — "Loading…" on dashboard, "INITIALISING" on admin/finance),
  F8 (spaced-rep Daily review — next_review_at stored, never a child quest; map shows no "review in N
  days"), F9 (glossary). Added new: F10 child achievement-shelf/badges on My journey, F11 printable/PDF
  weekly plan. Static: type-check+lint green; npm audit 9 high but ALL dev-only eslint toolchain
  (minimatch/brace-expansion, no fix) — prod CVEs stay cleared (overrides intact). Test family now has
  3 children (Sam Smoke, Ivy Test, Sam Test). Pattern: MCP profile persisted the SMOKE login autofill
  (parent = one click); admin/tutor need clear+fill; `/logout` POST between switches + browser_close.
  Radio options use U+2212 minus in labels — `getByRole('radio',{name})` is flaky; click by DOM index
  (`[role=radio]`) instead. Emailed owner the scenario summary via scripts/email-findings.ts (Brevo).
- 2026-07-27 — Mechanic build run, DECISION `all` (owner named the whole ~10-item list, no cap).
  ALL 10 SHIPPED + green-gated (type-check + tests + lint + build, one commit each, pushed to main)
  + LIVE-VERIFIED on edway.uk with Playwright. **B1** admin recent-activity now maps topic_tag→
  curriculum title (new `adminRecentLogs` returns `AdminRecentLog` w/ `topic_title`, humanised-slug
  fallback) — live admin showed "Negative Numbers & Powers", "Fractions & Measures", not "Maths Ks3
  Negatives". **B2** admin metric hint "completed sessions"→"completed this week" (banned-glossary
  copy) — live confirmed. **B3** added `public/favicon.ico` — sharp CAN'T write .ico, so I generated
  16/32/48 PNGs via sharp and hand-wrapped them in an ICO container (6-byte ICONDIR + 16-byte dir
  entries + PNG payloads); live `/favicon.ico`→200 `image/vnd.microsoft.icon`. **F3** number-line /
  dot-array / groups math figures in `deriveMathVisual` (parses `a±b` incl. U+2212 & bracketed
  negatives, `a×b`/`a²`, `½/¼/word of N` — capped: line span ≤20, dots ≤144) + SVG renderers; live
  the "−3 + 7" practice figure read `img "A number line: start at -3, move 7 right to land on 4."`
  **F5** per-topic mastery certificate: new `topicCertificate(parentId,child,tag)` (SHA-256 over
  facts, ownership-checked) + child `/learn/certificate?topic=` route + print-to-PDF view + "Save my
  certificate" button on the mastered screen; live rendered "Ivy · Negative Numbers & Powers · Awarded
  27 July 2026 · <hash>". **F7** skeleton loading: dashboard + `/learn` already had skeletons; added
  `(admin)/admin/loading.tsx` (kills the generic root "Initialising" splash on ALL admin pages incl
  finance) + `(child)/learn/lesson/loading.tsx`. reduced-motion is already globally neutralised
  (globals.css `animation-duration:0.01ms`), so no per-skeleton guard needed. **F8** the spaced-rep
  review loop was ALREADY fully built on main (`/learn/warmup` + `dueReviewWarmup` + `recordReviewResult`
  + map "review comes up in N days") — the only missing piece the finding named was OVERDUENESS ORDER;
  added pure `dueReviewTopics(candidates,now,max?)` (most-overdue first, legacy no-schedule rows front)
  + wired into `dueReviewWarmup`, unit-tested. **F9** tap-to-define glossary: pure `lib/child/glossary.ts`
  (`normaliseGlossary`+`splitByGlossary` — whole-word, longest-first, first-occurrence-only, reconstructs
  text exactly) + `<GlossaryText>` popover (keyboard+touch, Escape/outside-close, Read-aloud via existing
  useNarration) threaded topic.glossary → DailyFlow → Explainer → StepReveal + LegacyExplainer; authored
  human glossary for 4 topics in curriculum.seed.bands.ts and RAN `npm run seed` (idempotent, curriculum-
  only: "4 topics / 6 questions written") to push live; live the negatives worked-example "number line"
  rendered as a chip whose popover showed the authored definition + Read-aloud. **F10** achievement shelf:
  pure `buildAchievementShelf(subjects)` (certified→badges, most-recent first, earned/total counts) +
  `<AchievementShelf>` on `/learn/map`, each badge links to its F5 certificate + calm "Not yet" locked
  slots; live showed "3 badges earned" (Negatives 27 Jul / Fractions 26 Jul / Arithmetic 25 Jul). **F11**
  printable weekly plan: `/schedule/print` route + `<SchedulePrintView>` (print-to-PDF, @media print
  CSS) fed by ownership-checked `getWeeklySchedule`, "Print / PDF" button on /schedule; live rendered
  "Ivy's week · Week of 27 July 2026" with per-day subject+topic+reason. ZERO console errors on child
  lesson + admin overview + finance. Teardown: `fetch('/logout',{method:'POST'})`→200 + browser_close.
  KEY LEARNINGS: (1) several "carried-over" findings were STALE — F8's whole flow + F5's per-SUBJECT
  parent certificate + F7's dashboard/lesson skeletons already existed on main; the honest move is to
  ship the specific unmet SLICE (F8 overdueness ordering; F5 per-TOPIC child cert; F7 admin skeleton) not
  re-build. Always grep for the feature before assuming it's absent. (2) To make a data-driven feature
  (F9 glossary) actually live-visible you must author + seed the data AND ensure the term appears in the
  SHOWN prose — all 12 bands topics use the worked-example (StepReveal) explainer, NOT summary/points, so
  glossary had to render in StepReveal scenario/steps and terms had to be words that appear there
  (checked "number line"/"like terms"/"tissues" against each worked example before authoring). (3) sharp
  has NO .ico encoder — build the ICO byte container by hand around sharp PNGs. (4) MCP profile still
  persists the SMOKE(parent) autofill (one-click); admin needs clear-then-fill; child mode needs no PIN
  when already authed as the owning parent + active-child cookie set.
- 2026-07-28 — Mechanic build run, DECISION `all` (owner named B1 + F1–F6 — 7 items, no cap).
  ALL 7 SHIPPED, each green-gated (type-check + tests + lint + build, one commit, pushed to main)
  AND live-verified on edway.uk with Playwright. **B1** generic AI question-figure made decorative
  (`alt=""` + `role="presentation"` on the AI-fallback `<img>` in practice-player.tsx) so
  screen-reader/narration skip meaningless filler; derived figures keep honest alt. Live: the
  algebra figure now announces a real description (see F1) — the exact prompts B1 flagged.
  **F1** (headline) `algebra_tiles` MathVisualSpec + parser in `lib/child/math-visual.ts` (collect
  like terms `ax±bx`, expand `a(x±b)`, scale `a×v`; capped coeff ≤12, rows ≤6) + accent tile
  renderer in `math-visual.tsx` + 11 unit tests. Pure fallback at the END of the deriveMathVisual
  chain (numeric derivers run first, so `4×3` stays an array; algebra needs a variable letter, so
  no collision). Live on "Simplify 4x + 2x": rendered `xxxx + xx = 6x` tiles with alt "Algebra
  tiles: 4 x-tiles combined with 2 more make 6 x-tiles, so 4x + 2x = 6x." Resolves B1 for algebra.
  **F2** distractor-aware "Why isn't that right?" — a wrong mcq answer offers an opt-in tap that
  calls the existing Checker-gated `/api/tutor` with the child's EXACT wrong option as
  `studentAnswer`; new PURE `distractorExplanation` helper (interactions.ts, 4 tests) renders AI
  text ONLY when `aiVerified`, else the human misconception/worked answer. Distress gate still runs
  first. Shown only when the concept-gap reteach isn't already offered (one calm AI-help control).
  Live: picked "8x" for 4x+2x → button appeared → tap → Checker-PASSED explanation "…add the
  coefficients of x together… simplified expression is 6x." **F3** child certs → parent portfolio:
  new ownership-checked `listTopicCertificates` (SAME SHA-256 canonical facts as the child-side
  `topicCertificate`, so hashes match) + "Mastery certificates" section on the child profile with
  per-topic download (parent `certificate` route now takes `?topic=`, new dashboard
  `TopicCertificateView`) + folded certified titles into the portfolio dossier Implementation
  evidence (optional param, byte-for-byte backward compatible → no portfolio test/hash break).
  Live: Ivy's profile listed 4 certs; downloaded "Algebraic Expressions · Maths · Awarded 28 July
  2026 · <hash>". **F4** `loading.tsx` skeletons for /learn/map|my-stuff|mock|warmup|certificate
  (only /learn + /learn/lesson had them) — kills the bare "Loading…" flash. Purely presentational.
  **F5** authored human glossary for the 8 topics that lacked one (terms chosen to appear in each
  topic's worked-example STEP/scenario prose, not the title) + `npm run seed` (curriculum-only,
  idempotent: "8 topics written"). Live: English Reading & Spelling step 2 rendered "spelling" as a
  chip whose popover showed the authored definition. **F6** highlight today's-plan subject on the
  child hub: new `todaysPlan` Quest flag (planned-today ∧ active ∧ not-done) → "Start here · today's
  plan" pill + accent ring + stable-sort lead position. Live (Tuesday = English plan, 0/10 not
  done): English led the cards with the pill. ZERO console errors across dashboard/child-profile/
  certificate/hub/two lessons/map. KEY LEARNINGS: (1) a new deriveMathVisual KIND is safe to add at
  the tail of the chain — the numeric parsers require digits on both sides, so algebra (which needs
  a letter) never collides; verify with a "4 × 3 stays an array" test. (2) When live-verifying a
  just-pushed UI change, the FIRST /learn load raced the Vercel deploy (F6 pill absent), a reload
  ~60s later showed it — always reload once if a fresh change looks missing before calling it a
  regression. (3) Glossary chips render in the worked-example STEP/scenario prose, NOT the title —
  author terms that appear in a `steps[].line` or `scenario`, and advance the StepReveal to reveal
  later steps when checking live. (4) Reused the parent CertificateView pattern for a per-TOPIC
  parent cert; identical SHA-256 canonical-facts hashing on both sides keeps LA verification
  consistent. Teardown: `fetch('/logout',{method:'POST'})`→200 + browser_close, as always. The
  cron's stale "never build F4/2FA" line remains OBSOLETE (2FA shipped; today's F4 was child
  skeletons — built).
- 2026-07-28 — Discovery pass, FULL coverage (parent/child/admin/tutor). Took the **Maths KS3
  Algebraic Expressions** lesson end-to-end as Ivy (Learn→Practise 3/3→Mastery 3/3→certified):
  wrong#1 calm name-nudge/no-red/2-left, correct=star burst, phase bar lit per stage. ALL of the
  2026-07-27 batch verified live + working: F3 math figures, F5 per-topic certificate
  (/learn/certificate rendered "Ivy · Algebraic Expressions · Awarded 28 July 2026 · <hash>"),
  F7 skeletons (dashboard/lesson/admin), F8 spaced-rep (hub renders a warm-up card only when
  dueReviewWarmup>0 — none due for Ivy today, correct behaviour, NOT a gap), F9 glossary
  ("like terms"/"coefficients" popovers + Read-aloud), F10 badge shelf ("4 badges earned"),
  F11 printable plan. Admin (overview/finance/users) + tutor READ-ONLY clean, tutor empty queue
  (silo holds). ZERO console errors on EVERY surface; no 390px overflow anywhere. type-check+lint
  green; npm audit 9 high but ALL dev-only eslint toolchain (no fix). Findings modest (mature): only
  real defect = B1 (Low a11y) — question figure always uses generic alt "Helpful visual for this
  {subject} question" incl. the AI-fallback path for algebra/text prompts (screen-reader/narration
  noise); fix = mark decorative (alt=""/role=presentation) when no derived MathVisualSpec. New
  ambitious features: F1 algebra-tiles visual + See-it animation (extends accepted deriveMathVisual
  fraction→number_line→array→algebra_tiles chain; serves Ivy's CURRENT KS3 algebra band; the algebra
  practice/mastery Qs "4x+2x","2(x+5)" all fall to the generic AI PNG today), F2 distractor-aware
  "why that's not right" (checker-gated /api/tutor, human fallback), F3 child certs→parent
  portfolio/LA evidence, F4 finish child sub-page skeletons (/learn/map|my-stuff|mock|warmup|
  certificate have NO loading.tsx — confirmed bare "Loading…" flash on /learn/map; only /learn +
  /learn/lesson have loading.tsx), F5 extend glossary to remaining KS2/KS3 topics (only 4 authored),
  F6 highlight today's-plan subject on child hub. Pattern: GREP before proposing — F8's warmup card
  IS wired in learn/page.tsx (warmupCount>0 gate); absence on screen just meant no reviews due, not a
  missing feature. Teardown: fetch('/logout',{method:'POST'})→200 between each role switch + browser_close.
- 2026-07-29 — Discovery pass, FULL coverage (parent/child/admin/tutor, desktop 1280 + mobile 390).
  Took the **Science KS2 "Living Things" (sci_ks2_living)** lesson end-to-end as Ivy (Learn→Practise
  3/3→Mastery 3/3→certified): glossary popover ("seed"→def+Read-aloud) worked FIRST TRY — the prior
  run's glossary stall was TRANSIENT, not reproducible (per the launcher's "be resilient" note: clicked
  once, it responded, moved on). wrong#1 calm name-nudge/no-red/2-left + "Why isn't that right?" (F2),
  correct=star burst, phase bar lit per stage, Save-certificate + badge shelf ("5 badges" incl. Living
  Things). Admin (overview/finance/curriculum/escalations) + tutor READ-ONLY clean, tutor empty queue
  (silo holds). ZERO console errors on EVERY surface; NO 390px overflow anywhere; /api/health 200. Static:
  type-check+lint GREEN; npm audit 9 high but ALL dev-only eslint toolchain (no non-breaking fix). Stack
  current (Next 15.5.18/React 19.0.0/Tailwind 4.3.3). Findings HONEST-SHORT (site is exceptionally mature):
  only 1 Low bug = B1 science questions render a decorative/generic AI PNG figure while maths shows a precise
  DERIVED figure (deriveMathVisual is maths-only) — consistency/a11y gap, overlaps F2. Features: F1 parent→
  child encouragement note (NEW, confirmed absent — headline human touch), F2 science derived question
  figures (extend the accepted math-visual chain into science, Ivy's active subject), F3 immediate "topic
  mastered" parent moment (only Monday digest exists today), F4 acknowledge low-mood check-in (mood already
  nudges difficulty silently — child never sees it), F5 in-lesson "show your working" photo→portfolio
  (ambitious, flagged child-safety), F6 dev-only eslint CVEs + React/Next patch (low). Pattern: GREP BEFORE
  PROPOSING paid off again — science See-it (ScienceStage) + autoplay narration + streak grace-day + mood→
  difficulty + parent insights panel + exam-decision card ALL already exist; dropped those. MCP profile
  persisted the SMOKE parent login (one-click); admin/tutor needed clear+type creds; `/logout` POST between
  each role switch + browser_close. Emailed owner the scenario summary via scripts/email-findings.ts.
- 2026-08-05 — Mechanic build run, DECISION `all` (owner named B1 + F1–F6 — 7 items, no cap; findings file
  2026-08-03). ALL 7 SHIPPED, each green-gated (type-check + tests + lint + build, one commit, pushed to main)
  AND live-verified on edway.uk with Playwright (except F5's deep end-state — see below). **B1** child profile
  "Current standing" now shows lesson-based competence: when a subject has no diagnostic/mock evaluation but has
  certified topics, it renders "Working at {band} · {n} certified" instead of "Not yet assessed" (added
  `certifiedBySubject` fetch + `bandBySubject` map to the page; presentation-only, exam-decision inputs
  untouched). Live: Ivy showed Maths "Working at GCSE level · 4 certified", English/Science "primary level · 1"
  — the "Not yet assessed" contradiction is gone. **F1** English derived question figures: new pure
  `lib/child/english-visual.ts` (`deriveEnglishVisual` → `plural_rule` build for "plural of X" + `letter_tiles`
  for a single quoted word; `pluralRuleFor` s/x/z/ch/sh→es, cons+y→ies, else s) + `EnglishVisual` tile renderer,
  wired in practice-player AFTER math+science (englishVisual = !math && !science). 10 unit tests. Live on the
  exact Scout-flagged "plural of 'box'": rendered "B O X + es · Words ending in 'x' add e-s", honest alt, and it
  deliberately does NOT spell "boxes" (base tiles + separate ending, teaches the rule without pre-answering the
  MCQ). **F2** SEND-aware reading default: `resolveReadingFont(child)` + `hasDyslexiaIndicator` — font defaults
  ON when `reading_font` is never-set AND `send_indicators` includes dyslexia; an explicit true/false always wins
  (both directions). Threaded through `readingSupportsFromChild` (lesson) + the My-stuff `currentReadingFont`.
  6 new tests. Live: Ivy's My-stuff "Easy-read font" = checked ON by default (ruler/size stay off), no dyslexia
  label shown to the child, still toggleable. **F3** parent note read-aloud on the child hub: extended
  `ParentNoteCard` with a "Hear it read to you" control that POSTs the note text to the CACHED `/api/tts` in the
  child's `voice_id` (the proven memory pattern — no new route/cost). Degrades by HIDING the control on 503/403.
  Live: set a note on Ivy, tapped it in child mode → button advanced to "Play again" (TTS fetch+playback
  succeeded end-to-end), zero console errors. **F4** parent-only Web Push (size L): added the `web-push` dep
  (LEAN tree — asn1.js/http_ece/https-proxy-agent/jws/minimist, NO minimatch/brace-expansion, so no new prod
  audit surface — chose the battle-tested lib over hand-rolled RFC-8291 crypto I couldn't live-verify).
  `lib/notify/web-push.ts` (VAPID env-gated `webPushConfigured`/`sendWebPush`, expiry 404/410 → prune),
  `PushSubscriptionDoc` on ParentDoc + repo `addPushSubscription`/`removePushSubscription` (keyed by endpoint),
  `/api/push/{public-key,subscribe,unsubscribe}`, SW `push`+`notificationclick` handlers (cache v2), emit from
  `pushEventNotification` alongside email/SMS (same `event_notifications_opt_out` gate), a `PushToggle` on
  /settings. Live: WEB_PUSH unset on prod ⇒ `/api/push/public-key` → subscribe control HIDDEN (graceful). **F5**
  child "Today I learned" chip reflection: pure `lib/child/reflection.ts` (5-chip enum + `reflectionFeedLine`),
  `submitReflection` server action (selection-only ⇒ NO free-text ⇒ no distress-gate surface), stored as a new
  `parent_events` type "reflection" (topic_title = warm feed line, one per child/day, re-tap updates), rendered
  on the dashboard activity feed (new kind + Heart style). 5 tests. Gated on `finishedToday` (a lesson done today
  AND all quests handled). **F6** cleared BOTH npm-audit highs (brace-expansion + fast-uri) via NON-force
  `npm audit fix` → 0 vulnerabilities (the advisory DB now HAS a fix — the 2026-07 "no fix exists" note is now
  STALE for these two; only lockfile transitive versions changed, no direct dep, gate stayed green). Next already
  at latest 15.5.22; React pinned 19.0.0 has no higher 19.0.x patch (19.1+ is a minor, out of "patch" scope —
  left it). KEY LEARNINGS: (1) a passive `fetch` to an endpoint that 503s logs a RED console error in the browser
  on every page load — my first F4 cut had /api/push/public-key return 503 when unconfigured, which broke Scout's
  zero-console-errors baseline on /settings. FIX (shipped as "Fix: F4 live regression"): return 200 `{key:null}`
  and let the client treat null as unavailable. Pattern: for an env-gated "is this feature on?" probe the client
  hits on load, return 200 with a null/flag payload, NEVER a 4xx/5xx, or you dirty the console. (2) When adding a
  push/crypto capability you can't fully live-verify (VAPID unset on prod), prefer the battle-tested lib over
  hand-rolled encryption — but FIRST check its dep tree (`npm view <pkg> dependencies`) so you don't drag
  minimatch/yargs into the prod runtime and undo the audit hygiene. (3) A new deriveVisual chain extends safely by
  running the new deriver LAST and gating it on the earlier ones being null (english = !math && !science) — no
  collisions, and the quoted-word regex must require the closing quote right after the word so a quoted SENTENCE
  never triggers a misleading single-word figure. (4) F5's live surface sits behind an expensive end-state
  (finish ALL of today's quests = 3 full lessons) — gate-verified + unit-tested + wired into the confirmed
  child hub, live all-done drive deferred rather than risk a fragile 30-interaction Playwright run (per the
  resilience note). Teardown: `fetch('/logout',{method:'POST'})`→200 + browser_close. MCP browser persisted the
  SMOKE login form autofill (one-click sign-in, no password typed).
- 2026-08-03 — Discovery pass (run at 2026-08-04 ~14:35 UTC; filename kept at owner-named 2026-08-03), FULL coverage
  (parent/child/admin/tutor, desktop 1280 + mobile 390 both confirmed). Took the **English KS2 "Reading & Spelling"
  (eng_ks2_reading)** lesson end-to-end as Ivy (mood "Tough day"→F4 warm ack; explainer; wrong#1 calm no-red/"Why isn't
  that right?"/2-left; correct star burst; practice 2/2→mastery 3/3→certified; phase bar per stage). Warm-up (spaced-rep)
  + mock (honest 1/10 lock) both work. Re-verified F5 (Work-evidence photo section + topic dropdown) shipped on the child
  profile; F1 text note + 5 certs also present. Admin (overview/finance/escalations) + tutor READ-ONLY clean, tutor empty
  queue (silo holds). ZERO console errors on EVERY surface; NO overflow in either viewport; /api/health 200. type-check +
  lint GREEN. npm audit now only **2 high, BOTH dev/build-only** (brace-expansion via eslint; fast-uri via @sentry
  webpack-plugin→ajv — a BUILD dep, not prod runtime) — no prod CVE. Findings HONEST-SHORT (very mature): only real bug =
  B1 (Low-Med) child profile "Current standing → Not yet assessed — run the diagnostic" shown for ALL 3 subjects while the
  same page reads "5 topics certified" + "Working at GCSE level" — contradiction; standings come only from evaluation_records
  (diagnostic/mock), ignoring lesson-based competence/band already in scope (bands, countCertified). Features: F1 English
  derived question figures (extend the accepted math/science-visual chain — English is the last subject rendering an EMPTY
  <figure>, confirmed live on "plural of box"; most build-ready), F2 SEND-aware reading defaults (send_indicators has
  "dyslexia" for Ivy but reading-supports default ALL OFF with no link to the flag — auto-default font-on when never-set),
  F3 parent AUDIO encouragement note (extends shipped F1 text note; MediaRecorder→/api/media/sign→child doc; accessibility
  win for a dyslexic reader), F4 web push milestones (reuse hand-rolled public/sw.js + VAPID, parents-only), F5 child
  "Today I learned" chip reflection→parent feed, F6 clear the 2 dev-only audit highs + Next/React patch (audit now says
  non-force fix available). INVESTIGATED-NOT-A-BUG: dashboard "no quests planned today" vs child hub "today's plan" pill was
  a load-order artifact (dashboard read before /schedule generated the doc; both use approval-tolerant getWeeklySchedule —
  todayCard reads schedule.items with no approved_by_parent filter), not a real inconsistency — checked repo.ts before
  reporting. Pattern: GREP/READ before reporting a cross-surface mismatch — it was a generate-on-first-access timing thing,
  not a bug. Teardown: /logout POST between each role switch + browser_close. Emailed owner the scenario summary via
  scripts/email-findings.ts (Brevo).
- 2026-08-06 — Discovery pass, FULL coverage (parent/child/admin/tutor; desktop 1280 + mobile 390 both
  confirmed innerWidth; whole-page scroll). Took the **Maths KS4 "Number & Place Value" (maths_number)**
  lesson end-to-end as Ivy (Learn→Practise 4/4→Mastery 3/3→certified): wrong#1 = misconception-specific
  calm nudge ("You picked 480 — that's 486 to the nearest ten…", no red/buzzer, "Why isn't that right?",
  2 tries left), correct = star burst, phase bar lit per stage, "Save my certificate"/"See it on my
  journey" at the end. Spaced-rep warm-up works ("½ of 16 → Spot on! Half of 16 is 8."); mock honestly
  gated (Maths now 5/10 after my cert). Admin (overview/finance/escalations) + tutor READ-ONLY clean,
  tutor empty queue (silo holds), my "Number & Place Value · 100%" showed in admin recent activity 5m
  after. ZERO console errors on EVERY surface, NO overflow either viewport, /api/health 200. Static:
  type-check + lint GREEN; **npm audit 0 vulnerabilities** (the 08-05 F6 audit-fix holds). Findings
  HONEST-SHORT (exceptionally mature): only bug = B1 (Low) child profile now shows band info TWICE —
  "Current standing" (post-08-05 fix = lesson-based band) duplicates the pre-existing "Working level"
  section. Headline feature = F1 rounding/place-value/standard-form derived question visuals — Ivy's
  ACTIVE maths topic renders generic AI figures because deriveMathVisual has no deriver for those shapes
  (only percent/groups/fraction/number-line[a±b]/array/algebra_tiles). Also F2 embed the REAL
  work-evidence photo URLs in the LA portfolio (portfolio.ts adds only a text line "Photo of written
  working — {topic}" today, no viewable link), F3 remaining bare "Loading…" text→skeleton (dashboard
  main island + lesson bootstrap still flash it), F4 "Explain it another way" on the explainer
  (checker-gated /api/tutor), F5 non-empty readiness trajectory for lesson-only families (mocks locked
  till 10/10 so trajectory empty for months), F6 child "See it" rounding/place-value teaching animation,
  F7 earlier first insight (MIN_SAMPLES too high — "Still learning Ivy's rhythm" despite many lessons),
  F8 React 19.x patch bump. NOT-A-BUG checks: "9×6" in a KS4 maths_number set is authored KS4 content
  (seed.extra.ts), not a band leak; "Edway Complete/Partner" tier labels are consistent across
  pricing + admin finance (real product names). Pattern: GREP the deriver/portfolio source before
  proposing — confirmed the visual gap (math-visual.ts has 6 kinds, none for round/place-value/standard
  form) and that work-evidence is text-only in the dossier, so both features are real not filler.
  Teardown: fetch('/logout',{method:'POST'})→200 between each role switch + browser_close. Emailed owner
  the scenario summary via scripts/email-findings.ts.

- 2026-08-07 (Mechanic, resume): finished the last 3 of the 2026-08-06 batch (F6-F8) after two
  prior session-limit cutoffs left 6/9 shipped. F6 place_value "See it" animation (rounding
  number-line + place-value columns) — new deterministic type wired into the normalize chain, own
  stage renderer + Your-turn recall, no AI-authored maths. F7 low-floor "getting started" learning
  insight so the panel isn't a blank "still learning" wall for engaged families (descriptive only,
  no child profiling; replaced by statistical lines once they unlock). F8 React 19.0.0→19.2.8 (latest
  19.x); a newly-published high-sev js-yaml advisory (dev-only, transitive via eslint) surfaced and
  was cleared with `npm audit fix` → 0 vulns. Pattern learned: "React patch bump" findings can hide a
  MINOR jump — check `npm view react@^19 version` and lean on the full build + a live homepage
  console-smoke (did: 0 hydration errors on 19.2.8). Health check clean: deploy READY, /api/health 200,
  runtime errors clean. All 9 items of 2026-08-06 now shipped.
- 2026-08-07 — Discovery pass, FULL coverage (parent/child/admin/tutor; desktop 1280 + mobile 390 both
  confirmed innerWidth; whole-page scroll). Took the **English KS2 "Reading & Spelling" (eng_ks2_reading)**
  lesson end-to-end as Ivy (Explainer → "Show me another way" → Practise 2/2 → Mastery 3/3 → certified):
  wrong#1 = calm name-nudge with a VIOLET (not red) tint on the chosen option, "Why isn't that right?",
  "2 tries left"; correct = star burst; phase bar lit per stage; English tile visuals (box→"b o x + es",
  church→"ch + es", begin letter-tiles) + glossary popover ("spelling") all live. F4 mood ack verified
  ("Tough day" → "Let's take it gentle today — one quest is plenty. 💛"). Whole 2026-08-06 batch re-verified
  live-shipped (child-profile dedupe, rounding/place-value visuals, certified-over-time trajectory, low-floor
  insight, "Show me another way"). Admin (overview/finance/escalations) + tutor READ-ONLY clean, tutor empty
  queue (silo holds). ZERO console errors on EVERY surface; NO overflow either viewport; /api/health 200.
  Static: type-check + lint GREEN; **npm audit = 1 MODERATE** (dompurify 3.4.12 XSS via posthog-js — `npm
  audit fix` bumps to 3.4.13, dry-run confirmed no --force; posthog-js also behind 1.386.6→1.414.0). Findings
  HONEST-SHORT (exceptionally mature): only bug = B1 (Low) the "Avg lesson time" dashboard card uses a
  hardcoded 45–60 MIN per-lesson band (dashboard-stats.ts) — but quests are ~2–15 min by design, so
  avgLessonTimeHint() perpetually says "below the 45–60 min target" (live showed "2m · below…"); recalibrate
  the band or reframe as daily-total. Features: F1 "Continue where you left off" resume card on the child hub
  (lesson_progress autosaves + resumes IN-lesson but the HUB/quest-cards never surfaces in-progress state —
  confirmed learn/page.tsx doesn't import lesson_progress), F2 material-properties science visual for
  sci_ks2_materials (Ivy's active Science topic; science-visual.ts has plant_parts/life_cycle/food_chain/
  states_of_matter/cell but NO material-properties kind, so "waterproof material" Qs hit the generic AI
  figure), F3 spoken answers (STT) for fill_blank via existing /api/stt + distress-gate (accessibility for
  dyslexic Ivy), F4 parent per-child curriculum roadmap (parent only sees certified-over-time, no forward
  topic view), F5 dompurify CVE + posthog bump, F6 post-mastery optional "brain stretch" for first-try
  masters, F7 warmer per-child "set up the week" nudge (Sam Smoke/Sam Test show cold "No quests planned").
  Pattern: GREP BEFORE REPORTING paid off twice — the visible "Loading…" during route transitions is an
  sr-only label inside a proper skeleton (NOT a bare-text regression), and science-visual.ts already exists
  (science figures shipped) so I proposed only the uncovered material-properties kind. MCP tool flaked
  intermittently on getByRole clicks ("Unexpected token while parsing css selector") — workaround: snapshot
  for a ref then click by ref, and avoid names with apostrophes (dispatch via evaluate DOM query instead).
  Teardown: fetch('/logout',{method:'POST'})→200 between each role switch + browser_close. Emailed owner the
  scenario summary via scripts/email-findings.ts.
- 2026-08-07 — Mechanic build run, DECISION `all` (B1 + F1–F7, 8 items, no cap; findings 2026-08-07). ALL
  green-gated (type-check + tests + lint + build, one commit each, pushed to main) AND live-verified on
  edway.uk with Playwright; zero browser console errors + zero Vercel runtime errors across the whole
  session. **B1** recalibrated the "Avg lesson time" band from a hardcoded 45–60 MIN/lesson to Edway's
  actual 8–20 MIN interactive-quest reality (dashboard-stats.ts constants + caption strings + test). Live:
  card reads "2m · below the 8–20 min target" (honest — Ivy's quests genuinely average ~2m, but the band is
  now the right shape). **F1** "Continue where you left off" resume card on the child hub: pure
  `buildResumeCards` (lib/child/resume.ts, filters genuinely-mid-lesson rows via the resolveResumeStep
  guards, most-recent first) + ownership-checked `getInProgressLessons(parentId,childId)` repo read +
  ResumeCards component above the quest grid. Live: after leaving a lesson mid-flow, hub showed "Pick up
  where you left off · Science · Materials & Their Properties · step 2 of 3". **F2** material-property
  science visual: new `material_property` kind in deriveScienceVisual (tail of the chain, keyword-gated on
  waterproof/transparent/magnetic/flexible/absorbent, runs AFTER states_of_matter so freeze/melt/ice wins)
  + MaterialProperty renderer (✔/✘ property-test tiles). KEY: shows the property TEST concept, NEVER the
  candidate materials, so it can't pre-answer the MCQ. Live on "Which material is waterproof?": rendered
  "Waterproof? · Does water soak through it? · ✔ Keeps water out / ✘ Water soaks through" (never names
  plastic). "Which of these is a metal?" correctly got NO visual (category, not an illustrable property).
  **F3** STALE finding — spoken-answer STT for fill_blank was ALREADY fully built on main (interaction.tsx
  applySpokenAnswer + practice-player mic gated `isMcq || fill_blank` + /api/stt transient+distress-checked
  + guardFreeText runs /api/safety-check BEFORE scoring; local check, no AI grading). No rebuild; "Speak"
  control confirmed live on the lesson surface; committed a Chore note. **F4** parent per-child curriculum
  roadmap: pure `buildRoadmapTopics` (certified/current/upcoming, exactly one "current") + ownership-checked
  `childSubjectRoadmap` repo read (reuses bandFromData) + RoadmapCard on the child profile. Live: showed
  Maths GCSE (Number & Place Value ✓ → Fractions NOW → upcoming), English/Science PRIMARY with their NOW.
  **F5** cleared the moderate dompurify XSS via non-force `npm audit fix` (nested 3.4.12→3.4.13, lockfile
  only, audit→0); deferred the OPTIONAL posthog-js major bump to avoid analytics-client-shift risk (CVE
  cleared without it). **F6** optional post-mastery "brain stretch": new `stretch` QuestionDoc kind (+
  SeedQuestion + BTuple), 3 human-authored stretch questions seeded (sci_ks2_materials, eng_ks3_reading,
  maths_ks2_arithmetic), self-contained BrainStretch component (offer→one harder Q→celebratory, NON-scoring,
  never gates mastery) threaded lesson-page→DailyFlow→PracticePlayer, rendered only when `mastered &&
  stretch`. RAN `npm run seed` (idempotent, curriculum-only, 9 written) to push the bonus Qs live. Live:
  certified sci_ks2_materials → "Fancy a brain stretch?" → "Which material is BOTH transparent AND
  waterproof?" → correct → "🌟 Wow, Ivy — you nailed the stretch!" with certificate intact. **F7** warmer
  per-child "Generate the week" nudge on the dashboard today-card empty state + made /schedule honor
  `?child=<id>` (ownership-safe via getChildById inside getActiveChild). Live: Sam Smoke + Sam Test both
  showed "Sam doesn't have a plan yet — set up this week in one tap"; clicking Sam Test's link loaded
  /schedule?child=… with "Approving confirms the week for Sam" (targeted the RIGHT child, not the Ivy
  active-child cookie). KEY LEARNINGS: (1) GREP/READ before building — F3 was 100% already shipped (scout
  false-negative); the honest move is a Chore verification note, not a rebuild. Two prior runs learned the
  same; keep checking the code first. (2) Adding a new deriveScienceVisual KIND at the TAIL is safe (earlier
  kinds win); for a "which material is X" figure, show the PROPERTY TEST (✔/✘ meaning), never the option
  materials, or you pre-answer the MCQ. (3) A new question `kind` union member fanned out to 3 type sites
  (QuestionDoc, SeedQuestion, admin curriculum's KIND_VARIANT/kindOrder Records) — type-check caught them;
  add the new key everywhere a `Record<kind,…>` exists. (4) For a data-driven child feature (F6 stretch),
  author + `npm run seed` (new unique prompt = clean INSERT, no orphan risk) THEN live-drive a full
  lesson to certification to see it — the offer only exists on the certified screen. (5) MCP getByRole
  clicks still flake on apostrophes/minus; click by DOM index/text via evaluate. Teardown: /logout POST →
  200 + browser_close.
- 2026-08-08 — Discovery pass, FULL coverage (parent/child/admin/tutor; desktop 1280 + mobile 390 both
  confirmed innerWidth). Friday = polish focus, and it paid off: found the run's headline defect on the
  polish pass. Took **Science KS3 "Cell Biology" (sci_ks3_cells)** end-to-end as Ivy (Learn→Practise 3/3
  incl. 1 deliberate wrong→Mastery 3/3→certified): calm-wrong held (gentle "Ivy, not quite yet…", "Why
  isn't that right?", "2 tries left", no red/buzzer), star burst, phase bar per stage, real derived
  cell-diagram figures w/ honest alt, cert+journey links. Ivy has cross-band progressed (Science now KS3,
  Maths GCSE). Admin (overview/finance/escalations) + tutor READ-ONLY clean, tutor empty queue (silo
  holds). ZERO console errors on EVERY surface. Static: type-check+lint GREEN; **npm audit 1 HIGH** =
  nanoid<3.3.17 (GHSA-2v37-7h3g-55p8) via postcss@8.5.23→nanoid@3.3.18, non-force `npm audit fix` clears
  it (F1). KEY FIND: **B1 real mobile overflow** — `maths_fractions` lesson horizontally scrolls ~21-31px
  at 390 (scrollWidth 411 vs iw 390). Root cause pinned: the SUMMARY explainer header
  (`components/child/explainer.tsx:195-196`) has `flex justify-between` with a long h1 in a
  `flex items-center gap-3` child that LACKS `min-w-0`, so the title can't wrap and the row overflows past
  the fixed 64px narration button. Sibling `step-reveal.tsx:93-94` HAS `min-w-0` — which is exactly why
  StepReveal topics (sci_ks3_cells, negatives) don't overflow but the summary-explainer fractions topic
  does. Fix = add min-w-0 to explainer.tsx line 196 + inner title div (line 206). B2 (Low a11y): child-hub
  "Hide note" btn 40px wide + header logo 32px tall (<44 Children's Code tap target). Features: F1 nanoid
  CVE, F2 band-promotion milestone (KS2→KS3→KS4 currently SILENT — biggest progression event, reuse
  parent_events + pushEventNotification), F3 canvas-confetti on certification+certificate (approved lib,
  reduced-motion+mute gated), F4 @axe-core/playwright in the a11y pass (approved, dev-only), F5 public
  /verify/<hash> certificate verification (cert hash exists but no public verify), F6 visual 7-dot streak
  strip on child hub. PATTERN: the "no overflow anywhere" claim from prior runs was viewport-thorough but
  DIDN'T open a summary-explainer lesson at 390 — the fractions topic uses the rarer summary explainer
  (most bands topics use StepReveal). Lesson: on the mobile pass, open a lesson whose title is LONG and
  check both explainer variants, not just the worked-example one. Teardown: fetch('/logout',POST)→200
  between each role switch + browser_close. Emailing owner the scenario summary via scripts/email-findings.ts.
- 2026-08-08 — Mechanic build run, DECISION `all` (B1, B2 + F1-F6, 8 items, no cap; findings 2026-08-08).
  ALL 8 SHIPPED, each green-gated (type-check + 713 tests + lint + build, one commit, pushed to main) AND
  live-verified on edway.uk (deploy 7e8fa80 waited to READY via Vercel MCP; zero browser console errors +
  zero Vercel runtime errors all session). **B1** child summary-explainer header overflow at 390: added
  `min-w-0` to the flex child + inner title div + `break-words` on the h1 in explainer.tsx (mirrors the
  StepReveal sibling). Live on maths_fractions at 390: scrollW 380 = clientW 380, overflow 0 (was 411 vs
  390). **B2** two child chrome tap targets <44px: hide-note btn h-10 w-10 -> h-11 w-11, child-header logo
  link min-h-11 py-1. Live measured: logo 96x44 (was 96x32), hide-note 44x64 (was 40x64), both >=44.
  **F1** nanoid CVE: `npm audit fix` bumped nested nanoid 3.3.16->3.3.18 (lockfile only, audit->0). NOTE:
  the scout report + `npm audit` said "nanoid <3.3.17" but the INSTALLED version was already 3.3.18 in one
  branch and 3.3.16 in postcss's tree; audit fix cleared it to 0. No live surface, gate-verified only.
  **F2** band-promotion milestone (KS2->KS3->KS4): detect a whole-band advance in logLessonCompletion by
  comparing `currentBandForSubject` before/after the certifying upsertCompetence; emit a deduped
  `band_promotion` parent_events row (new type across types.ts/parent-events.ts/activity-feed/email
  template + repo ActivityFeedItem) via the existing pushEventNotification (email/SMS/web-push, opt-out
  aware) AND a warm child-mode celebration on the certified screen. KEY invariant: the key-stage BAND label
  is PARENT-only — the child result returns `{ subjectLabel }` (child-safe subject name, no KS), so the
  celebration reads "You unlocked a whole new set of {Maths|English|Science} adventures!" never "KS3". Pure
  copy unit-tested. LIVE: gate + unit only — driving a real band crossing needs certifying an entire
  remaining band (fragile 30+ interactions), deferred per the resilience note; certified-screen + activity
  feed render clean. **F3** canvas-confetti (added zero-dep 1.9.4 + @types, audit 0): tiny
  `components/fx/confetti-burst.tsx` fires a ~1s pop on the certified screen + child certificate, DOUBLE
  reduced-motion gated (useReducedMotion early-return + lib disableForReducedMotion), pointer-events-none
  (lib default) so it never blocks a tap, dynamic import so it's a bundled chunk (NO CDN). Live on the
  child certificate: page renders clean, ZERO console errors, ZERO external/CDN network fetch (self-hosted);
  canvas is transient so it was gone by eval time (expected). **F4** @axe-core/playwright (dev-only devDep
  4.12.1, only pulls axe-core, audit 0): `e2e/a11y-audit.ts` helper + a11y.public/a11y.authed specs +
  playwright.a11y.config.ts + `npm run a11y`. Groups violations by impact, FAILS on any critical (highest
  bar so pre-existing lesser issues don't red it). LIVE-RAN `npm run a11y --project=public` against edway.uk:
  2 passed, 0 critical, and it surfaced 1 pre-existing SERIOUS color-contrast on marketing / (the tool's
  whole value). **F5** public /verify-certificate page + /verify-certificate/<hash> deep link + rate-limited
  `/api/verify-certificate` (per-IP, 20/min like newsletter). New repo `verifyTopicCertificate(hash)`
  recomputes the SHA-256 over every certified topic's canonical facts (same primitive as topicCertificate)
  and returns ONLY the printed facts (first name/topic/subject/date). GOTCHA: `(auth)/verify` already owns
  `/verify`, so an optional catch-all at `/verify/[[...hash]]` is SHADOWED at the base path — relocated to
  `/verify-certificate/[[...hash]]` (clean, no collision). Live-verified all 3 paths: invalid-format ->
  guidance, valid-but-unknown -> "No matching certificate", real Ivy sci_ks3_cells hash deep-link ->
  "Verified authentic · Ivy mastered Cells & Organisms (Science), awarded 2026-08-08". **F6** 7-dot week
  streak strip on the child hub: pure `weekStrip(completionMs, now)` engine fn (Mon..Sun, active/isToday/
  future, +5 tests) + `childWeekStrip` repo reader + static `WeekStrip` component (accent-driven, no motion
  so inherently reduced-motion-safe, no tracking). Live on Ivy's hub at 390: "This week: 4 days with a
  completed lesson", no overflow. KEY LEARNINGS: (1) when a new PUBLIC route's URL segment overlaps an
  existing route group (here `/verify`), an optional catch-all silently loses the base path to the existing
  static page — grep `find src/app -type d -name <seg>` BEFORE choosing the path; a distinct name
  (`/verify-certificate`) is cleaner than fighting the collision. (2) A new `parent_events` `type` fans out
  to ~5 sites (ParentEventDoc union, ParentEventType, buildParentEventCopy switch, activity-feed STYLES +
  present() switch, repo ActivityFeedItem union, email template `kind` union) — type-check + the exhaustive
  switch catch them all; add the key everywhere a union/Record exists. (3) To detect a band crossing
  deterministically, snapshot `currentBandForSubject` BEFORE the certifying write and compare AFTER — it
  reads certified rows from the DB so the before/after bracket around upsertCompetence gives the exact
  delta; keep the band label out of the child-facing return type entirely (return only a child-safe subject
  label) so the parent-only-banding invariant is enforced at the boundary. (4) canvas-confetti + axe-core/
  playwright both have LEAN dep trees (canvas-confetti zero deps; @axe-core/playwright only axe-core) — no
  minimatch/brace-expansion drag, audit stayed 0. (5) MCP `browser_type`/`browser_click` flaked on
  ref-based + `has-text` name selectors ("Unexpected token while parsing css selector"); a plain CSS
  selector target (`#cert-hash`, `button:has-text("Verify")`) worked. Teardown: fetch('/logout',POST)->200
  + browser_close. Health: newest prod deploy READY, /api/health reachable, runtime errors clean.
- 2026-08-09 (Mechanic, resume of the 2026-08-08 SECOND batch) — DECISION `all`; batch-1 (B1,B2,F1-F6)
  was already shipped, so I built ONLY the unchecked batch-2 items B3, F7, F8, F9, F10, F11 (6 of 6). ALL
  SHIPPED, each green-gated (type-check + tests + lint + build, one commit, pushed to main) AND
  live-verified on edway.uk (deploy 7893cc1 waited to READY via Vercel MCP; zero browser console errors +
  zero Vercel runtime errors all session). Test count 715 -> 736. **B3** retired the ambiguous sci_body
  diagnostic "Where is most water absorbed in digestion? -> large intestine" (at GCSE the SMALL intestine
  absorbs most water, so the keyed answer contradicted "most"). Followed the findings' RETIRE-AND-REWORD
  exactly (owner-approved wording, did not invent my own answer): new prompt "Which organ's main job is to
  reabsorb water from the material left after digestion?" -> large intestine, options with NO "small
  intestine" so it's unambiguous. GOTCHA the memory kept warning about: the seed upserts on topic_tag+prompt
  and NEVER deletes, so a reworded prompt INSERTS a new row and ORPHANS the old wrong one, which would keep
  reaching children. So retire-and-reword is only safe if you ALSO delete the orphan. I ran `npm run seed`
  (idempotent) then a ONE-OFF targeted `deleteOne({topic_tag:"sci_body", prompt:"<old>"})` via a throwaway
  scripts/_retire-b3.mts (modeled on seed's loadEnv, deleted after use). Verified live DB: orphan count 0,
  replacement answer "large intestine". LESSON: "retire" a seed question = reword in the file + seed + delete
  the exact old doc; a reword alone is NOT a retire. **F7** transcribed the 6 authored exam-style command-word
  questions VERBATIM into curriculum.seed.ts. The tuple format (QTuple) can't carry hints/misconceptions, so I
  added them as full SeedQuestion objects in a new `EXAM_STYLE_QUESTIONS` array spread into `SEED_QUESTIONS`
  (mirrors the existing SEED_QUESTIONS_INTERACTIVE pattern) rather than shoehorning the tuple system. Vitest
  proves each is well-formed + the quantitative ones compute (60/0.8=75, 240/4*10=600, 3*2 & 4+3, 150/10=15).
  Live DB read confirmed all 6 present with correct keyed answers. **F8** added `maths_mensuration` topic
  (order 11, prereq maths_geometry) + the 3 authored starters (1 practice, 2 mastery). KEY coupling finding,
  contra the scout note: the mock gate is NOT "certify all topics", it's a FIXED floor `certifiedBySubject >= 10`
  with a Math.min(.,10) cap, and certifiedBySubject counts across ALL bands — so adding an 11th GCSE maths
  topic does NOT make the mock unreachable (it stays 10, reachable). Making it "count-driven = all 11" would
  have been the ACTUAL trap (mensuration has only 2 mastery Qs; requiring all 11 risks a thin topic blocking
  the mock). So the correct fix is a REACHABLE FLOOR: new `lib/engine/mock-gate.ts` `mockUnlockCount(subject)`
  = min(gcseTopicCount, 10), wired into both mock pages + learn hub course-completion; a test asserts maths=11
  GCSE topics but unlock stays 10 and never exceeds the topic count. Confirmed the topic is certifiable with 2
  mastery Qs: `selectMasteryAttempt` returns min(bank,3) and certification is score===total, so a 2/2 perfect
  certifies (no dead-end). Live: mensuration lesson renders + authored area question + "Brilliant!" on correct;
  mock hub shows "Certify 10 topics... You have 5/10" (gate intact). **F9** new pure `lib/engine/mock-paper.ts`:
  `mockPaperFraming(subject)` (maths=Non-calculator, science=Calculator allowed, english=Reading and writing),
  `mockTierWindow(readiness)` (Higher >=85 else Foundation), `selectMockPaper(pool,count,targetTier?)` that
  clusters the paper in the tier window and TOPS UP with nearest tiers so it always fills. buildMockPaper takes
  an optional targetTier; the mock page derives readiness from latestEvaluationsBySubject and passes framing +
  tier props to MockExamPlayer (calm badge + condition line). Gate-verified + unit-tested; the exam framing
  SCREEN needs an unlocked mock (Ivy all locked <10 certified) so the live drive was deferred per the
  resilience note (mock hub itself verified clean). **F10** new pure `interleaveDueReviews` in
  spaced-repetition.ts: takes the most-overdue-first list and round-robins across SUBJECT buckets (bucket
  insertion order = ordered, so the global most-overdue still LEADS), then wired into dueReviewWarmup by
  joining certified topics -> subject. Live proof was the clearest of the run: Ivy's warm-up ran Negatives
  (maths) -> Living Things (science) -> Algebraic Expressions (maths), i.e. it interleaved instead of blocking
  the two maths topics. **F11** mirrored the shipped mcq `celebrate` settle (accent fill-sweep + self-drawing
  check, gated `showCorrect && chosen` and `!reduced`) onto the tap_reveal card and the drag_drop correct slot;
  wrong path untouched (soft dim, never red). Needed `overflow-hidden` + `relative z-10` on the content so the
  absolute sweep clips behind. Presentational, no new pure logic -> no Vitest. Live screenshot on the geometry
  drag_drop: all three correct slots showed the neon border + teal->green sweep + drawn check, calm-wrong law
  held. tap_reveal shares the identical verified code path. SEEDING: ran `npm run seed` ONCE for B3+F7+F8
  together (1 topic, 16 questions written) after all three were committed, rather than three live-DB touches.
  KEY LEARNINGS: (1) a seed "retire" MUST delete the orphaned old doc (seed never deletes) or the wrong item
  keeps being served; reword-in-file + seed + targeted deleteOne. (2) Don't trust a scout "this will break the
  gate" note at face value: READ the gate. Here the mock gate was a fixed reachable floor, so the SAFE change
  was to keep it a floor (min with topic count), NOT to raise it to the topic count as the note implied, which
  would have been the real breakage. (3) For questions needing hints/misconceptions, add full SeedQuestion
  objects (like SEED_QUESTIONS_INTERACTIVE) instead of extending the compact tuple. (4) F11-class settle motion
  needs the container `overflow-hidden` + content `relative z-10` or the sweep paints over the text. (5) The MCP
  browser persisted the SMOKE parent autofill again (one-click sign-in, no password typed); child mode needed no
  PIN with the active-child cookie set to Ivy. Teardown: fetch('/logout',POST)->200 + browser_close. Health:
  newest prod deploy READY, /api/health 200 {ok,db:up}, runtime errors clean. (The two ERROR deployments in the
  list are Dependabot PR preview builds on a dependabot/* branch, not production, ignored per the runbook.)
- 2026-08-08 (Scout, second pass, GCSE curriculum focus) — Re-run on the same UTC day AFTER Mechanic
  shipped batch-1 (B1,B2,F1-F6). Extended findings/2026-08-08.md with a clearly separated "Second batch"
  (fresh IDs B3, F7-F11) so nothing collides; DECISION: all governs both. FULL Playwright re-verify:
  /api/health 200; marketing desktop+mobile, parent dashboard+child hub, admin (overview/finance) + tutor
  (read-only, empty queue, silo holds) all ZERO console errors both viewports. Drove maths_fractions as Ivy:
  **B1 overflow fix LIVE** (scrollW 380 @ iw 390, was 411); calm-wrong held (violet oklab not red, "2 tries
  left", "Why isn't that right?"), correct="Brilliant!" settle + See-it. Batch-1 F6 week-strip, F3 parent-note
  audio, F5 /verify-certificate all live-clean. Logged out of all 3 accounts + browser_close. HEADLINE:
  audited the WHOLE seed bank for correctness — re-derived every quantitative answer + checked every factual
  canonical across all 5 files (curriculum.seed.ts/.bands/.extra/.foundation/.interactive, ~130 Qs). Bank is
  remarkably CLEAN: only ONE ambiguous item = B3 (sci_body extra "where is most water absorbed → large
  intestine"; at GCSE the small intestine absorbs most water, so keyed answer contradicts "most" — flagged
  Medium, read-and-flag only, recommend retire+reword since prompt is the natural key). Features are
  curriculum-weighted: F7 authored 6 exam-style command-word Qs IN FULL (SeedQuestion shape, spec-cited,
  each re-checked for exactly one defensible answer: reverse %, recipe proportion, standard-form arithmetic,
  speed calc, neutralisation products, personification effect); F8 add missing GCSE Maths MENSURATION strand
  (area/perimeter/volume/circles — biggest spec hole, maths_geometry is angles-only) + 3 checked starters,
  GOTCHA: adding a topic breaks the hardcoded TOPICS_PER_SUBJECT=10 mock gate (learn/mock/[subject]/page.tsx:25)
  so that must become count-driven; F9 mock calc/non-calc framing + tier-targeted paper (exam-decision already
  computes tier; mock is flat 15-min 10-MCQ); F10 interleave topics/subjects in the spaced-rep warm-up
  (dueReviewTopics currently blocks most-overdue-first); F11 correct-settle flourish for tap_reveal+drag_drop
  (mcq got it via F3 07-23, these two only get a static border). Created automation/backlog.md (6 north-star
  epics). Static: type-check + lint GREEN, npm audit 0 vulns. Pattern: the seed bank is mature and accurate,
  so the curriculum value is now COVERAGE + exam-condition fidelity + command-word framing, not correctness
  fixes — audit for gaps and author exam-style items, don't expect to find wrong answers. Emailing owner the
  new-findings summary via scripts/email-findings.ts.
- 2026-08-09 (Scout) — Discovery pass, FULL coverage (parent/child/admin/tutor; desktop iw 1280 +
  mobile iw 390 both confirmed, whole-page). Day-focus = latest-stack (UTC Sunday). Took Science
  "Forces & Motion" (sci_ks3_forces) end-to-end as Ivy: explainer (StepReveal + "Friction" glossary
  chip + narration) -> practice 3/3 (one deliberate WRONG) -> mastery 3/3 -> certified + band-promotion
  celebration ("You unlocked a whole new set of Science adventures!", child-safe, no key-stage).
  Calm-wrong law PASS: measured the wrong option colour = oklab(0.606 0.085 -0.202), a VIOLET tint
  (negative b), NOT red; "Why isn't that right?" + escalating hint + "2 tries left". ZERO console
  errors on EVERY surface (marketing x5 both viewports, /login, dashboard, full lesson, admin
  overview+finance, tutor). /api/health 200 {db:up}. Tutor empty queue -> silo holds. Teardown:
  /logout POST x3 -> 200 + browser_close. Static: type-check + lint GREEN, npm audit 0. Security
  headers strong AND Permissions-Policy correctly route-scoped (mic=(self) only /learn; camera+mic
  self+meet.jit.si only /tutor) -> NOT a bug. NEW BUG this run (the value of desktop-first + landmark
  checks): B1 the parent /dashboard root page AND the whole /admin group have NO <main> landmark
  (document.querySelector('main')===null; only NAV+HEADER) while every sibling dashboard page +
  tutor + marketing DO — root cause: dashboard layout wraps children in <div id="main-content">
  (not <main>) and /dashboard/page.tsx renders top-level <div>s; admin layout has no <main> and no
  SkipLink. Fix = wrap dashboard/page.tsx content in <main> (do NOT flip the layout div or child
  pages double-main) + add <main>+SkipLink to admin layout. B2 (Low a11y) marketing / has a SERIOUS
  color-contrast axe violation the shipped `npm run a11y --project=public` already surfaced (08-08)
  but never fixed (pass only fails on critical). CURRICULUM: re-audited curriculum.seed.extra.ts +
  the F7 exam-style + F8 mensuration items by re-deriving every quantitative answer -> CLEAN, no
  correctness bug (bank now ~140 items, remarkably accurate; value is coverage + command-word fidelity).
  F1 (headline) authored 5 exam-style command-word Qs IN FULL (SeedQuestion shape, spec-cited, one
  defensible computable answer each, distinct distractors): maths_algebra_linear "Solve 4x+5=29"->x=6,
  maths_pythagoras "Calculate hypotenuse of 6,8"->10, maths_statistics "Work out P(blue)" 5/10=1/2,
  sci_electricity "Calculate V=IR" 2x5=10, eng_analysis "Explain simile 'like tired eyes'". F2 add
  maths_inequalities strand (Edexcel A22) + 3 starters. Latest-stack deep-dive: F3 in-range refresh
  batch, F4 Next 15.5.22->16.3.0 major (evaluate+stage, gate on preview), F5 framer-motion->motion +
  lucide/tailwind-merge/eslint-10 majors. F6 warm hint entrance + calm See-it beckon (calm-wrong law).
  F7 nonce-based CSP to drop script-src 'unsafe-inline' (pair with F4). F8 parent "topics due for
  review" digest line. GREP-BEFORE-PROPOSING again paid off: EPIC 5's "confirm spacing widens" is
  ALREADY done (spaced-repetition.ts doubles interval on correct recall, cap 90d, resets to 7 on
  wrong) so I dropped that and pivoted to the parent-visibility gap. MCP browser persisted the SMOKE
  parent autofill (one-click); admin/tutor needed JS-set of both fields (React native-setter + input
  event) since autofill was parent's. Emailing owner the scenario summary via scripts/email-findings.ts.
- 2026-08-09 (Mechanic build run, DECISION `all`; B1,B2 + F1-F8, 10 items). SHIPPED 7 green-gated +
  live-verified (B1, B2, F1, F2, F3, F6, F8); EVALUATED-AND-DEFERRED 3 majors/risky (F4, F5, F7). Each
  shipped item: type-check + tests (748) + lint + build green, one commit, pushed to main; live-checked
  on edway.uk after the Vercel deploy went READY (via Vercel MCP). **B1** wrapped the parent
  /dashboard page content in <main> (both empty-state and populated branches) and added <main
  id=main-content> + <SkipLink> to the (admin) layout; verified live: /dashboard has exactly one <main>
  (no double-main under the layout #main-content DIV), /admin has one <main id=main-content> + skip link
  (checked as ADMIN_* AND SMOKE_ADMIN_*). **B2** marketing homepage color-contrast: darkened warm-theme
  tokens clay-500 #C57F2A->#A25C17, clay-600 #A6651F->#8E5316, ink-500 #8C846E->#787056 (fixes the
  subscribe button white-on-clay 3.12, eyebrow-pill clay-600-remapped text 4.2, and mono trust labels
  3.5). GOTCHA: my first pass missed 2 nodes because I `head -40`'d the axe output; a SECOND commit
  raised the footer/newsletter `text-forest-200/60` captions to /70 (was 4.34 on the dark forest panel).
  Re-ran @axe-core/playwright against prod -> 0 serious color-contrast. LESSON: never truncate the axe
  node list; count `nodes.length` across ALL color-contrast violations and fix every pair (there were
  ~4 distinct token pairs, not one). **F1** transcribed 5 exam-style command-word Qs VERBATIM into
  EXAM_STYLE_QUESTIONS (Solve/Calculate/Work out/Explain across maths_algebra_linear, maths_pythagoras,
  maths_statistics, sci_electricity, eng_analysis); Vitest proves well-formed + computes; DB read on
  prod confirmed all 5 present with correct keyed answers. **F2** added maths_inequalities GCSE topic
  (Edexcel A22) + number-line worked example + inequality/number-line glossary (inline on the topic,
  since curriculum.seed.ts SEED_TOPICS only spreads worked_example, NOT glossary like the bands file) +
  3 verbatim starters; mock unlock stays min(gcseCount,10)=10 (updated the batch2 test 11->12 GCSE maths
  topics). Seeded once for F1+F2 together (1 topic, 14 questions written). **F3** in-range refresh via
  `npm update <named>` (excluded posthog-js per memory, react pinned, majors left): next 15.5.23, sentry
  10.69, mongodb 7.5, stripe 22.4, jose 6.2.8, playwright 1.62, vitest 4.1.10; audit stayed 0. GOTCHA:
  stripe 22.4 added an `OtherString` forward-compat catch-all to Subscription.Status, making the
  billingStatusForStripe switch non-exhaustive (TS2366) -> added a cautious `default: return "past_due"`.
  **F6** wrong-answer delight: See-it button became a motion.button with a one-time entrance + single
  slow scale breathe (delay 0.28s, once), hint card + rungs gated on useReducedMotion; live-drove
  maths_fractions 2 wrong -> See-it unlocked, clickable immediately (beckon never gates the tap), wrong
  option oklab b=-0.20 (violet, not red), 0 console errors. **F8** parent digest review line: pure
  reviewDueCounts (overdue vs coming-due-this-week from next_review_at) + buildReviewDueLine (warm, no
  dashes, warm-up CTA) + weeklyDigestForParent returns per-child reviewDue + template renders it; unit
  tested; no live surface (cron email) so gate-verified. **F4 (Next 16) DEFERRED**: installed
  16.3.0 locally -> type-check + build GREEN (Turbopack default; async request APIs already adopted), but
  `npm run lint` BREAKS under eslint-config-next 16 (eslintrc ConfigValidator schema error) and build
  warns middleware->proxy + Edge-Runtime deprecations; also a Next MAJOR must not hit main (=prod) without
  the required preview gate this trunk/read-only-Vercel run can't produce. Reverted to 15.5.23. **F5
  (motion/lucide/tailwind-merge/eslint10) DEFERRED**: motion rename touches every child animation
  surface -> needs a live lesson + reduced-motion pass on a preview; eslint 10 couples to F4's lint
  break; hold as a set for the Next 16 preview branch. **F7 (nonce CSP) DEFERRED**: the canonical Next 15
  nonce recipe forces every page dynamic (next.config.ts documents this as a DELIBERATE choice), it's
  medium-risk silent-CSP-break on a children's platform with no preview gate, and the finding says pair
  with F4 (Next 16 first-class nonce). Small known inline surface (2 THEME_NOFLASH_SCRIPT tags; JSON-LD is
  data not script-src). KEY LEARNINGS: (1) axe groups color-contrast as ONE violation with N nodes; sum
  nodes across all violations and fix every distinct token pair, don't stop at the first screenful. (2)
  For the verify script after the playwright 1.62 bump, `npx playwright install chromium` then launch
  playwright-core with the headless-shell executablePath; read creds from .env.local and never print
  them. (3) Admin login in a script needs `domcontentloaded` + a fixed waitForTimeout, NOT
  `waitForLoadState('networkidle')` (analytics keeps the network busy so networkidle races and lands you
  back on /login). (4) The MCP eval right after a client nav can read a stale DOM (dashboard <main> read
  0 then 1 on re-eval) — re-eval once before calling a landmark missing. (5) A new curriculum glossary on
  a curriculum.seed.ts GCSE topic must be inline on the topic object (that file's SEED_TOPICS builder only
  spreads worked_example); the bands file has its own GLOSSARY_BY_TOPIC. Teardown: /logout POST +
  browser_close. Health: newest prod deploy READY, /api/health 200, runtime errors clean.
- 2026-08-11 (Scout) — Discovery pass, day-focus = PERFORMANCE (UTC Tuesday). Parent (SMOKE) + child
  (Ivy) + marketing coverage full (desktop iw 1280 + mobile iw 390, whole-page); admin/tutor NOT
  re-authenticated this pass (chose to keep their creds off the wire; both read-only + clean every
  recent run — noted honestly in the report). Took **English "Sentence Structure" (eng_ks2_writing)**
  end-to-end as Ivy: explainer (StepReveal + "capital letter"/"full stop" glossary chips + narration
  + "Show me another way") → practice 3/3 (one deliberate WRONG: violet oklab b=-0.20 NOT red, "Ivy,
  not quite yet — have another go", "Why isn't that right?", "2 tries left", escalating hint) →
  mastery 3/3 → certified + band-promotion celebration ("You unlocked a whole new set of English
  adventures!", child-safe, no key-stage). ZERO console errors on EVERY surface; /api/health 200;
  type-check + lint GREEN; npm audit 0. HEADLINE PERF FIND: homepage cold-load LCP **2272ms** while
  FCP 608ms — the LCP element is the hero <h1> which animates from opacity:0 + blur(8px) + y:40
  (hero.tsx wordVariants + delayChildren 0.15 + duration 0.9), so contentful paint of in-HTML text is
  deferred ~1.6s; on throttled mobile this crosses the 2.5s budget (B1). Also `/` ships ~1.78MB JS /
  32 chunks (two big: 498KB + 411KB) + 128KB CSS (F2 = LazyMotion + dynamic below-fold sections, on
  the CURRENT framer-motion, NOT the deferred `motion` rename). And 16 marketing components use
  framer-motion with only stats-strip/count-up guarding reduced-motion + NO global MotionConfig, so
  prefers-reduced-motion users still get every entrance (globals.css 0.01ms rule only affects CSS
  anims, not framer JS) → F1 one `<MotionConfig reducedMotion="user">` wrapper fixes all of it.
  NEW BUG (a11y, the value of the parent sweep): **B2 /portfolio has NO <main> landmark** (only NAV;
  #main-content absent) — the 2026-08-09 landmark fix covered dashboard root + admin but MISSED
  portfolio, which owns its own <div className="relative min-h-screen"> shell (page.tsx:45,48);
  every other dashboard page has exactly one <main>. Fix = change the content div (line 48) to <main
  id="main-content">. Curriculum (headline lane): authored 6 exam-style command-word Qs IN FULL
  (F3 maths_sequences/geometry/graphs, F4 sci_forces accel + sci_reactions Mr + eng_analysis metaphor
  effect), each one defensible + re-derived. Delight (owner standing priority): F5 calm answer-REVEAL
  guiding glow (the biggest un-celebrated moment — reveal after a miss), F6 fill_blank supportive
  wrong-settle (last type without its own miss feedback). PATTERN: (1) an animated LCP element is a
  silent perf killer — measure LCP vs FCP on a COLD load (a big FCP→LCP gap on a text element = the
  hero is fading in); framer-motion's JS transitions are NOT covered by the reduced-motion CSS
  override. (2) SPA soft-nav does NOT repopulate performance paint/LCP entries, so only the FIRST
  hard page load gives a real LCP number — measure the target page as the first navigation. (3) GREP
  the <main> across (dashboard) to find the odd-one-out landmark miss rather than eyeballing. Teardown:
  fetch('/logout',POST)→200 + browser_close. Emailing owner the scenario summary via email-findings.ts.
