# Automation memory (Scout + Mechanic self-improvement log)

Both agents read this at the start of every run and append to it at the end.
It's how the loop compounds: taste the owner has shown, patterns that worked,
mistakes not to repeat. Keep entries short and dated. Newest at the bottom.

## Owner preferences (accepted / rejected patterns)
- **DO NOT build F4 (TOTP 2FA).** The owner has uncommitted 2FA work in the tree
  (`totp.ts`, `secret-box.ts`, modified `login/actions.ts`, `repo.ts`, `types.ts`,
  `verification.ts` + a test). Leave those files untouched until the owner commits
  it themselves. Skip F4 in any run.

## Things that broke (do not repeat)
- (empty)

## Patterns that worked (repeat these)
- (empty)

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
