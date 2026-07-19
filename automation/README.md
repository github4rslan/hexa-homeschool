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

## Config
- Production target: `https://edway.uk` (override via `SCOUT_BASE_URL`).
- Schedule: two daily cloud routines (Scout morning, Mechanic night) — see the
  schedule set up via the `/schedule` skill. Adjust times/timezone there.

## Running manually (any interactive session)
- Discovery now:  `use the scout agent`
- Build today's:  `use the mechanic agent`
