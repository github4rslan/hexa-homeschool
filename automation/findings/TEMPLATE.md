# Scout findings — <YYYY-MM-DD>

DECISION: all

<!--
  How to steer tonight's Mechanic run (edit the line above during the day):
    all           → build EVERY item below (default)
    B1, F2, F5    → build ONLY these IDs
    skip          → build nothing tonight
  Leave it as `all` and do nothing to run fully autonomous.
  IDs: B# = bug fix, F# = feature / upgrade. Checkboxes are set by Mechanic.
-->

Runtime: <playwright | fallback-curl>  ·  Base URL: <https://edway.uk>

---

## Bugs (Critical → Low)

- [ ] **B1 · <SEVERITY> · <title>** — `file:line`
  - Repro / evidence: <steps, console error, screenshot path>
  - Root cause: <one line>
  - Fix: <smallest correct change>
  - Risk: <what fixing might touch>

## Features & upgrades (High value → Low)

- [ ] **F1 · <lane: security | ui | stack | feature> · <title>** (size: S/M/L)
  - The win: <why it's worth building>
  - Change: <concrete — files, approach>
  - Risk: <what to watch>

---

## Summary
- Bugs: <n> (<critical>/<high>/<med>/<low>)  ·  Features: <n>
- Top 3 to ship: <IDs + one-line each>
