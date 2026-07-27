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
