# Task Brief Template

A reusable, agent-agnostic execution brief for shipping work on Edway (HEXA).
Works the same whether you drive it with **Codex** or **Claude Code**.

## How to use

1. Copy the block between the two `=== BRIEF ===` markers below into a new
   session opened in the `hexa-website` directory.
2. Fill in every `〈…〉` placeholder. Delete sections that don't apply.
3. Leave the **Guardrails** and **Definition of Done** sections intact — they are
   the project's non-negotiable invariants and the agent should treat them as
   hard constraints, not suggestions.
4. Run the session. When it reports "done", check the DoD boxes yourself before
   trusting the push.

> One brief = one feature = one commit. If your idea contains two features, write
> two briefs. Bundling unrelated work into one commit makes per-feature revert
> impossible.

---

<!-- === BRIEF === (copy from here) -->

# Feature: 〈short feature name〉

## Objective
〈One or two sentences: what to build/change and the user-visible outcome.
 State the audience — marketing / auth / parent dashboard / child / admin.〉

## Context (why)
〈The problem this solves. Link any doc, issue, or bug-audit ID. If this is an
 enterprise-hardening task, name the standard you're raising the bar to.〉

## Scope
- In scope: 〈bullet the concrete changes〉
- Out of scope: 〈what NOT to touch — protect against scope creep〉

## Acceptance criteria
- [ ] 〈observable behaviour 1〉
- [ ] 〈observable behaviour 2〉
- [ ] 〈edge case / failure mode handled〉

## Guardrails — hard invariants (do not violate)

**Runtime / deploy**
- Do **not** run the app locally (`npm run dev` / `start`). Verify statically only.
- The repo is **public** and **push-to-`main` deploys to production**. Commit
  straight to `main` (no branches/PRs). One feature-scoped commit, message names
  the feature. Never commit secrets or the root `*.pdf` briefs.

**Data**
- MongoDB is the only system of record. **Never** add Supabase/Postgres calls.
- All child-scoped data access goes through `lib/db/repo.ts` with its ownership
  checks (`assertOwnsChild` / `parentOwnsChild`). Never call `getCollection`
  directly in a route handler (public `newsletter` is the sole exception).

**Child safety (UK Children's Code / safeguarding)**
- The distress/safety gate (`checkDistress`) runs **before** any AI call. Never
  reorder or bypass it. Over-triggering is fine; missing distress is not.
- AI output for children passes the Teaching-Agent → **Checker** pipeline. Below
  the confidence threshold, serve the human-authored fallback. Never send raw
  model output to `(child)` routes. OpenAI explains; it never invents curriculum.
- Analytics (PostHog) must **never** be mounted in `(child)` or any shared
  component a child route renders. `/api/stt` audio is transient — never store it.

**Observability / privacy**
- Sentry carries **no PII**. Keep the shared `scrubAndTag` scrubber; never add
  `sendDefaultPii: true`, replay, or per-config `beforeSend` overrides.

**Resilience**
- Missing feature env vars degrade gracefully (typed config errors → clean 503 /
  no-op), never crash. Preserve this when adding any integration.

## Files likely involved
〈List the files/dirs you expect to touch, e.g. `src/lib/…`, a route group,
 tests in `tests/`. Helps the agent stay focused. If unsure, ask it to propose
 the file list first and confirm before editing.〉

## Tests required
- Add/extend **Vitest** unit tests in `tests/` for any new pure logic
  (safety, engine, billing maps, week math, RBAC, etc.). Tests are pure logic
  only — no DB, no network.
- If the change affects a critical parent/child flow, note whether a Playwright
  smoke spec in `e2e/` should be updated (owner-run, not CI-gated by default).

## Definition of Done (verify before pushing)
- [ ] `npm run type-check` — clean (primary verification)
- [ ] `npm test` — all Vitest tests pass
- [ ] `npm run lint` — clean
- [ ] `npm run build` — production build succeeds
- [ ] New logic has tests; acceptance criteria all met
- [ ] Docs updated if behaviour/architecture changed (`docs/` + `CLAUDE.md`)
- [ ] No secrets, no PDFs, no unrelated changes in the diff
- [ ] Single feature-scoped commit on `main`, then pushed (push = the release)

## Notes for the agent
- If a guardrail conflicts with the objective, **stop and surface it** — do not
  silently work around a safety/data invariant.
- Prefer many small focused files (200–400 lines, 800 max), high cohesion.
- If anything about scope or approach is ambiguous, propose a short plan and the
  file list first, then execute after confirmation.

<!-- === BRIEF === (copy to here) -->

---

## Worked example (filled in)

# Feature: Admin action audit log

## Objective
Record every state-changing admin action (curriculum edits, entitlement
overrides, escalation resolutions) to an append-only `admin_audit` collection,
surfaced read-only on `(admin)/audit`. Audience: admin/staff.

## Context (why)
Enterprise readiness: today admin mutations leave no trail, so we can't answer
"who changed this and when" during an incident or a safeguarding review.

## Scope
- In scope: audit write helper in `repo.ts`, wiring into existing admin
  mutations, a read-only audit view, indexes in `scripts/seed.ts`.
- Out of scope: editing/deleting audit entries, exporting, parent-facing views.

## Acceptance criteria
- [ ] Every admin mutation writes one immutable audit row (actor id, action,
      target, timestamp) via `repo.ts`.
- [ ] `(admin)/audit` lists entries newest-first, read-only, paginated.
- [ ] No PII beyond actor Mongo id; nothing child-identifying is logged.

*(Guardrails, Tests, and Definition of Done sections carry over unchanged.)*
