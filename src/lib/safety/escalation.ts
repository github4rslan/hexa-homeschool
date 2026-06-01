/**
 * Safety escalation matcher (Brief: Human Safety Net Escalation Matrix).
 *
 * Conservative, fail-safe distress detection on child-entered/AI-bound text.
 * If a distress phrase is matched, the child session must FREEZE and an
 * escalation must be logged + surfaced to the parent. This is intentionally
 * simple and auditable — over-triggering is acceptable; missing real distress
 * is not.
 *
 * STRICT SCOPE (Brief): this is educational safeguarding only — no clinical or
 * behavioural profiling. It freezes, notifies the parent, and logs. Nothing more.
 */

export type Severity = "immediate" | "critical" | "high" | "medium" | "low";

export interface EscalationMatch {
  matched: boolean;
  trigger: string;
  severity: Severity;
  /** The phrase that matched (for the audit log). */
  phrase: string;
}

// Distress phrases per the brief's matrix (e.g. "stupid", "I hate this",
// "giving up"). Lower-cased, word-boundary matched.
const DISTRESS_PATTERNS: { phrase: string; severity: Severity }[] = [
  { phrase: "i give up", severity: "critical" },
  { phrase: "giving up", severity: "critical" },
  { phrase: "i can't do this", severity: "critical" },
  { phrase: "i cant do this", severity: "critical" },
  { phrase: "i hate this", severity: "high" },
  { phrase: "i hate myself", severity: "immediate" },
  { phrase: "i'm stupid", severity: "high" },
  { phrase: "im stupid", severity: "high" },
  { phrase: "so stupid", severity: "high" },
  { phrase: "i want to die", severity: "immediate" },
  { phrase: "kill myself", severity: "immediate" },
  { phrase: "hurt myself", severity: "immediate" },
  { phrase: "no one cares", severity: "high" },
  { phrase: "i'm worthless", severity: "immediate" },
];

const SEVERITY_RANK: Record<Severity, number> = {
  immediate: 5,
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/** Scan text; returns the highest-severity match (fail-safe). */
export function checkDistress(text: string): EscalationMatch {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z'\s]/g, " ")} `;
  let best: EscalationMatch = {
    matched: false,
    trigger: "",
    severity: "low",
    phrase: "",
  };
  for (const { phrase, severity } of DISTRESS_PATTERNS) {
    if (haystack.includes(` ${phrase} `) || haystack.includes(phrase)) {
      if (!best.matched || SEVERITY_RANK[severity] > SEVERITY_RANK[best.severity]) {
        best = {
          matched: true,
          trigger: "Child distress keyword",
          severity,
          phrase,
        };
      }
    }
  }
  return best;
}
