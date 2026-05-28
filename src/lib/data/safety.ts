/**
 * Human Safety Net & Exception Gateways.
 * Source: HEXA Technical Brief v1.0, Section 4.
 */

export type SeverityLevel = "immediate" | "critical" | "high" | "medium" | "low";

export interface SafetyTrigger {
  id: string;
  name: string;
  condition: string;
  sla: string;
  slaMinutes: number;
  severity: SeverityLevel;
  action: string;
}

export const SAFETY_TRIGGERS: SafetyTrigger[] = [
  {
    id: "safeguarding",
    name: "Safeguarding Intercept",
    condition:
      "Input strings matching risk vectors, self-harm indicators, or abuse markers.",
    sla: "Immediate",
    slaMinutes: 0,
    severity: "immediate",
    action:
      "Execute emergency protective workflows; report directly to relevant external statutory bodies.",
  },
  {
    id: "distress",
    name: "Distress Vector Intercept",
    condition:
      "Input strings matching structural despair metrics (e.g. 'giving up', 'hate this').",
    sla: "5 Minutes",
    slaMinutes: 5,
    severity: "critical",
    action:
      "Freeze instructional terminal; notify account administrators; route historical logs to human review queue.",
  },
  {
    id: "concept-block",
    name: "Persistent Concept Block",
    condition:
      "Three sequential instructional failures within a single specialised sub-topic.",
    sla: "15 Minutes",
    slaMinutes: 15,
    severity: "high",
    action:
      "Halt automated variations; flag for marketplace tutor intervention; notify parent dashboard.",
  },
  {
    id: "checker-cascade",
    name: "Checker Cascade",
    condition: "Checker blocks execution three times within a single session loop.",
    sla: "15 Minutes",
    slaMinutes: 15,
    severity: "high",
    action:
      "Quarantine current model weights; drop back to static human-authored instructional content templates.",
  },
  {
    id: "manual-escalation",
    name: "Manual Escalation Request",
    condition: "Direct intervention request triggered by parent interface.",
    sla: "1 Hour",
    slaMinutes: 60,
    severity: "medium",
    action:
      "Assign case to verified marketplace tutor network matching specific academic domain.",
  },
  {
    id: "statutory-audit",
    name: "Statutory Audit Alert",
    condition:
      "Local Authority formal notification or compliance audit initiation.",
    sla: "4 Hours",
    slaMinutes: 240,
    severity: "medium",
    action:
      "Route case file directly to retained education law specialists; flag internal portfolio reviews.",
  },
  {
    id: "drift",
    name: "Systemic Drift Detection",
    condition: "Meta Checker triggers an automated systemic drift warning flag.",
    sla: "24 Hours",
    slaMinutes: 1440,
    severity: "low",
    action:
      "Initiate comprehensive architectural review; roll back underlying prompt definitions to stable releases.",
  },
];
