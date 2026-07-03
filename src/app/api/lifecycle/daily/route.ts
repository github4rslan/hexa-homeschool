import { NextResponse } from "next/server";
import {
  findDiagnosticNudgeCandidates,
  findReengagementCandidates,
} from "@/lib/db/repo";
import { emailConfigured } from "@/lib/email/send";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";
import { sendReengagementEmail } from "@/lib/email/reengagement-send";
import { diagnosticNudgeTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";
import { cronAuthorized } from "@/lib/auth/cron-auth";
import {
  decideReengagement,
  STAGE_THRESHOLD_DAYS,
  type ReengStage,
  type ReengReason,
} from "@/lib/engine/reengagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Account must be at least this old before the day-2 nudge fires. */
const NUDGE_MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/** Idle floor before a parent is even a re-engagement candidate (stage-1 gate). */
const REENGAGE_MIN_IDLE_MS = STAGE_THRESHOLD_DAYS[1] * 24 * 60 * 60 * 1000;

/** Bound per run so the cron stays inside its window and never mail-storms. */
const REENGAGE_MAX_SENDS = 200;
const REENGAGE_CANDIDATE_LIMIT = 1000;

/**
 * Daily lifecycle email cron. Triggered by Vercel Cron (see vercel.json) with
 * `Authorization: Bearer ${CRON_SECRET}`. Two jobs:
 *   1. Day-2 diagnostic nudge (never-activated parents) — existing.
 *   2. Segmented re-engagement / win-back series (activated parents who went
 *      quiet) — the escalating, capped, reset-on-return cadence. All decisions
 *      come from the pure `decideReengagement`; sends are idempotent per stage.
 *
 * `?dry_run=1` evaluates and reports the re-engagement decisions WITHOUT sending
 * a single email — so a run can be validated against real production data safely.
 * Everything remains CRON_SECRET-gated; unset Brevo makes real sends clean no-ops.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Lifecycle emails not configured. Set CRON_SECRET to enable." },
      { status: 503 },
    );
  }
  if (!cronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";

  // A real (non-dry) run needs Brevo; a dry run only evaluates decisions.
  if (!emailConfigured() && !dryRun) {
    return NextResponse.json(
      { error: "Email not configured. Set BREVO_API_KEY to enable." },
      { status: 503 },
    );
  }

  // ── 1. Diagnostic nudge (skipped in dry-run) ──────────────
  const nudge = { candidates: 0, sent: 0, skipped: 0, failed: 0 };
  if (!dryRun) {
    const candidates = await findDiagnosticNudgeCandidates(NUDGE_MIN_AGE_MS);
    nudge.candidates = candidates.length;
    for (const { parent, firstChildName } of candidates) {
      if (!parent._id) continue;
      const parentId = parent._id.toHexString();
      try {
        const res = await sendLifecycleEmail(parentId, "diagnostic_nudge", () => {
          const tmpl = diagnosticNudgeTemplate({
            name: parent.full_name,
            childName: firstChildName,
            diagnosticUrl: `${appUrl()}/onboarding/diagnostic`,
            settingsUrl: `${appUrl()}/settings`,
          });
          return { to: parent.email, subject: tmpl.subject, html: tmpl.html };
        });
        if (res.sent) nudge.sent++;
        else if (res.reason === "send-failed") nudge.failed++;
        else nudge.skipped++;
      } catch (err) {
        nudge.failed++;
        console.error("[lifecycle] nudge failed for parent", parentId, err);
      }
    }
  }

  // ── 2. Re-engagement / win-back series ────────────────────
  const now = new Date();
  const byStage: Record<ReengStage, number> = { 1: 0, 2: 0, 3: 0 };
  const byTrack = { upsell: 0, reengage: 0 };
  const noneReasons: Partial<Record<ReengReason, number>> = {};
  const reengage = {
    candidates: 0,
    evaluated: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    capped: false,
    dryRun,
    byStage,
    byTrack,
    noneReasons,
    sample: [] as { stage: ReengStage; track: string }[],
  };

  const candidates = await findReengagementCandidates(
    REENGAGE_MIN_IDLE_MS,
    REENGAGE_CANDIDATE_LIMIT,
  );
  reengage.candidates = candidates.length;

  for (const { parent, childFirstName } of candidates) {
    if (reengage.sent >= REENGAGE_MAX_SENDS) {
      reengage.capped = true;
      break;
    }
    reengage.evaluated++;
    const decision = decideReengagement({
      now,
      lastActive: parent.last_active ?? null,
      tier: parent.subscription_tier,
      billingStatus: parent.billing_status,
      optedOut: Boolean(parent.marketing_emails_opt_out),
      state: {
        sentKeys: parent.reengagement_sent ?? [],
        lastSentAt: parent.reengagement_last_sent_at ?? null,
      },
    });

    if (decision.action === "none") {
      noneReasons[decision.reason] = (noneReasons[decision.reason] ?? 0) + 1;
      continue;
    }

    // A send is due.
    byStage[decision.stage]++;
    byTrack[decision.track]++;
    if (reengage.sample.length < 10) {
      reengage.sample.push({ stage: decision.stage, track: decision.track });
    }

    if (dryRun) {
      reengage.sent++; // "would send"
      continue;
    }

    const res = await sendReengagementEmail({
      parent,
      childFirstName,
      stage: decision.stage,
      track: decision.track,
      claimKey: decision.claimKey,
      idleSince: parent.last_active!,
    });
    if (res.sent) reengage.sent++;
    else if (res.reason === "send-failed") reengage.failed++;
    else reengage.skipped++;
  }

  return NextResponse.json(
    { ok: true, dry_run: dryRun, diagnostic_nudge: nudge, reengagement: reengage },
    { headers: { "Cache-Control": "no-store" } },
  );
}
