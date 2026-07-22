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
