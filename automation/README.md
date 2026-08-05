# Edway self-improvement loop

Two autonomous agents run daily and compound on each other.

```
DAY  ──►  Scout (.claude/agents/scout.md)          [discovery only, never edits code]
          • Playwright-explores https://edway.uk + reads the codebase
          • Hunts bugs AND invents features (security / UI / latest-stack / new capability)
          • Writes automation/findings/<date>.md  → commits + pushes to main

     ──►  You, during the day: skim the report. Edit its DECISION line if you want.
          Do nothing = it builds everything tonight.

NIGHT ──►  Mechanic (.claude/agents/mechanic.md)    [implements + ships]
          • Reads today's findings + your DECISION line
          • Builds each selected item, one green-gated commit per item, pushed to main (= deploys)
          • Skips anything that would fail the build or weaken an invariant
          • Both agents append what they learned to automation/memory.md
```

## The DECISION line (your only lever)
Top of each `automation/findings/<date>.md`:

| You write   | Mechanic builds tonight        |
|-------------|--------------------------------|
| `all`       | every item (this is the default) |
| `B1, F3`    | only those IDs                 |
| `skip`      | nothing                        |

`all` is written by default, so ignoring the report = fully autonomous.

## Guardrails (so the loop can't sabotage itself)
- Never pushes a red tree — `type-check + test + lint + build` must pass first.
- One commit per item → clean per-feature revert if you dislike something.
- Never edits the agents' own definitions, `.claude/rules/`, or the invariants.
- Discovery (Scout) and implementation (Mechanic) are separate runs.

## Session-limit resilience (checkpoint + auto-resume)
Agents can't see their own usage budget, so instead of stopping early they make
every cutoff safe:
- **Checkpointing** — Mechanic commits each item's done-checkbox *with* the item
  and resumes from the first unchecked one; Scout writes its report progressively
  and extends today's file rather than restarting. A cutoff loses at most one
  in-progress item.
- **Auto-resume protocol (orchestrator)** — when a Scout/Mechanic run dies with a
  session/usage-limit error, read the reset time from the error and schedule a
  **one-shot** wake-up ~5 min after it (local Asia/Karachi tz) to resume the same
  day, instead of waiting for the next daily run. The daily cron's prompt carries
  this instruction; follow it for manual runs too.

## Config
- Production target: `https://edway.uk` (override via `SCOUT_BASE_URL`).
- Schedule: **three in-session crons** (this chat). **Scout 12:03 PM** (day,
  discovery) and **Mechanic 10:03 PM** (night, build) — daily, 10h apart so each
  gets a fresh session window. Plus a **HEALTH-CHECK every 6h** (`:17`) that runs
  Mechanic in health-check mode (§H): via the read-only Vercel MCP it confirms the
  live deploy is READY + scans runtime errors, safely self-corrects a clear
  recent-commit regression, and emails an alert for anything it shouldn't fix
  (env/config/child-safety) — quiet when healthy. Manual: `/health`.
- **No per-run cap: Mechanic builds the whole findings list** each run
  (highest-ranked first). If it hits a session limit partway, checkpoint +
  auto-resume continue it from the first unchecked item — nothing lost.
- Crons live only while this chat is open; re-arm on reopen. Cancel with
  `CronDelete`. (Not cloud — this repo isn't wired to the GitHub cloud runner.)

## Running manually (any interactive session)
- Discovery now:  `/scout` (or `/scout <a feature idea>`) — or `use the scout agent`
- Build today's:  `/mechanic` — or `use the mechanic agent`
