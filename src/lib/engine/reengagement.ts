/**
 * Lifecycle re-engagement decision engine — PURE, deterministic, unit-tested.
 *
 * Given one parent's activity + billing + opt-out + prior-send state, decide the
 * single next re-engagement email to send (or none). This is where correctness
 * lives; the cron and repo are thin wiring around it. No I/O, no Date.now(): the
 * caller passes `now`, so every branch is testable.
 *
 * COMPLIANCE (baked into the code, not owner questions):
 *  - Triggered ONLY by the PARENT's `last_active` + tier/billing — never by any
 *    child behavioural signal. No child is emailed, profiled, or tracked.
 *  - These are MARKETING emails: an opted-out parent is ALWAYS excluded here, and
 *    the send path attaches a working one-click unsubscribe (PECR/GDPR).
 *  - Escalating + capped: at most three emails per idle cycle (gentle → value →
 *    win-back), then STOP. A stage is never sent twice in one cycle.
 *  - Resets on return: the cycle is anchored to the `last_active` value, so once
 *    the parent comes back (a later `last_active`) the series starts fresh.
 */

export type ReengTrack = "upsell" | "reengage";
export type ReengStage = 1 | 2 | 3;

export interface ReengState {
  /** Prior claim keys, `"<lastActiveMs>:<stage>"` (ParentDoc.reengagement_sent). */
  sentKeys: string[];
  /** Timestamp of the most recent re-engagement email, if any. */
  lastSentAt: Date | null;
}

export interface ReengInput {
  now: Date;
  /** Parent activity heartbeat. Null = never active → not our segment. */
  lastActive: Date | null;
  tier: "diagnostic" | "standard" | "family";
  billingStatus: "trialing" | "active" | "past_due" | "canceled" | "paused";
  /** marketing_emails_opt_out — an opted-out parent is always excluded. */
  optedOut: boolean;
  state: ReengState;
}

export type ReengReason =
  | "opted-out"
  | "no-activity"
  | "dunning-excluded"
  | "not-idle-yet"
  | "series-capped"
  | "spacing";

export type ReengDecision =
  | { action: "send"; stage: ReengStage; track: ReengTrack; claimKey: string }
  | { action: "none"; reason: ReengReason };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Idle days at/after which each escalating stage becomes eligible. */
export const STAGE_THRESHOLD_DAYS: Record<ReengStage, number> = {
  1: 3, // gentle: "we miss you — [child]'s next lesson is ready"
  2: 10, // value: "here's what [child] is missing" (+ upsell for free tier)
  3: 21, // win-back: free → subscribe CTA/incentive; paid → warm check-in
};

/** Minimum gap between two sends WITHIN a cycle (stops a late-found parent
 * getting stages 1→2→3 on consecutive days). Thresholds space a fresh cycle. */
export const MIN_GAP_DAYS = 3;

/** The last escalating stage — after this the series is capped and stops. */
export const MAX_STAGE: ReengStage = 3;

/**
 * Attribution window for the re-activation KPI: a send is credited with a
 * re-activation only if the parent's `last_active` advances past the send within
 * this many days. Kept generous — win-back nudges can take a week or two to land.
 */
export const REACTIVATION_WINDOW_DAYS = 14;

/** Claim key for a (cycle, stage): embeds the anchoring `last_active` ms. */
export function cycleKey(lastActive: Date, stage: ReengStage): string {
  return `${lastActive.getTime()}:${stage}`;
}

/**
 * Which track a parent belongs to:
 *  - paid AND active/trialing → "reengage" (NO upsell — they already pay)
 *  - everyone else we email (free/diagnostic, or lapsed canceled/paused) →
 *    "upsell" (win-back with what a plan unlocks / a subscribe CTA)
 * `past_due` is handled separately (dunning) and never reaches here.
 */
export function trackFor(
  tier: ReengInput["tier"],
  billingStatus: ReengInput["billingStatus"],
): ReengTrack {
  const paid = tier === "standard" || tier === "family";
  const activeBilling = billingStatus === "active" || billingStatus === "trialing";
  return paid && activeBilling ? "reengage" : "upsell";
}

/** Highest stage already sent in the CURRENT idle cycle (0 if none). */
export function highestSentStage(state: ReengState, lastActive: Date): number {
  const prefix = `${lastActive.getTime()}:`;
  let highest = 0;
  for (const key of state.sentKeys) {
    if (!key.startsWith(prefix)) continue; // a prior cycle — ignored (reset)
    const stage = Number(key.slice(prefix.length));
    if (Number.isFinite(stage) && stage > highest) highest = stage;
  }
  return highest;
}

/**
 * Decide the next re-engagement email for one parent. Returns exactly one send
 * (the next escalating stage) or a reasoned "none". Deterministic in `now`.
 */
export function decideReengagement(input: ReengInput): ReengDecision {
  // 1. Opt-out is absolute for marketing email.
  if (input.optedOut) return { action: "none", reason: "opted-out" };

  // 2. Never-active parents are the onboarding-rescue segment (welcome /
  //    diagnostic nudge), not re-engagement — we have no idle signal for them.
  if (!input.lastActive) return { action: "none", reason: "no-activity" };

  // 3. past_due is dunning, a separate track — never win-back/upsell here.
  if (input.billingStatus === "past_due") {
    return { action: "none", reason: "dunning-excluded" };
  }

  const idleMs = input.now.getTime() - input.lastActive.getTime();
  const idleDays = idleMs / DAY_MS;

  const highest = highestSentStage(input.state, input.lastActive);

  // 4. Cap: after the final stage, the series stops until the parent returns
  //    (a later last_active anchors a fresh cycle where highest resets to 0).
  if (highest >= MAX_STAGE) return { action: "none", reason: "series-capped" };

  const nextStage = (highest + 1) as ReengStage;

  // 5. Not idle long enough for the next stage yet.
  if (idleDays < STAGE_THRESHOLD_DAYS[nextStage]) {
    return { action: "none", reason: "not-idle-yet" };
  }

  // 6. Spacing: for the 2nd/3rd email of a cycle, enforce a min gap since the
  //    last send (the first email of a cycle is paced by the threshold alone).
  if (highest >= 1 && input.state.lastSentAt) {
    const sinceLast = input.now.getTime() - input.state.lastSentAt.getTime();
    if (sinceLast < MIN_GAP_DAYS * DAY_MS) {
      return { action: "none", reason: "spacing" };
    }
  }

  return {
    action: "send",
    stage: nextStage,
    track: trackFor(input.tier, input.billingStatus),
    claimKey: cycleKey(input.lastActive, nextStage),
  };
}
