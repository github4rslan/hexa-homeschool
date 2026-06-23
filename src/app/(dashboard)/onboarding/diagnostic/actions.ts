"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getChildById,
  getActiveChild,
  insertEvaluations,
  markDiagnosticCompleted,
  releaseDiagnosticCompletion,
  getDiagnosticCompletion,
  restartDiagnosticBaseline,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { captureServer } from "@/lib/analytics/server";
import { verifyParentPin } from "@/lib/auth/parent-pin";
import { restartConfirmationIsValid } from "@/lib/diagnostic/restart";

export interface DiagnosticSubjectOutcome {
  subject: "mathematics" | "english" | "science";
  readiness: number; // 0–100
  workingGrade: string; // e.g. "Grade 4–5"
}

export interface PersistResult {
  persisted: boolean;
  reason?: string;
}

export interface RestartDiagnosticState {
  ok: boolean;
  error?: string;
  setupRequired?: boolean;
}

export async function verifyDiagnosticRestartPin(
  _prevState: RestartDiagnosticState,
  formData: FormData,
): Promise<RestartDiagnosticState> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, error: "Please sign in again." };
  return verifyParentPin(parentId, formData.get("parent_pin"));
}

export async function restartDiagnosticAction(
  childId: string,
  _prevState: RestartDiagnosticState,
  formData: FormData,
): Promise<RestartDiagnosticState> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, error: "Please sign in again." };

  if (!restartConfirmationIsValid(formData.get("confirm_restart"))) {
    return {
      ok: false,
      error: "Confirm that the new assessment will replace the saved baseline.",
    };
  }

  // Re-check the PIN in the mutating action. Passing the first dialog alone
  // never grants a reusable or client-forgeable permission.
  const pinCheck = await verifyParentPin(parentId, formData.get("parent_pin"));
  if (!pinCheck.ok) return pinCheck;

  const child = await getChildById(parentId, childId);
  if (!child?._id) {
    return { ok: false, error: "That child profile was not found." };
  }

  const result = await restartDiagnosticBaseline(parentId, child._id);
  if (!result.ok) {
    return {
      ok: false,
      error: "The assessment could not be restarted. Please try again.",
    };
  }

  revalidatePath("/onboarding");
  revalidatePath("/onboarding/diagnostic");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/children/${childId}`);
  return { ok: true };
}

/**
 * Persist diagnostic outcomes to the evaluations collection for the parent's
 * most-recent child. No-ops gracefully if not signed in or no child yet.
 * Ownership is enforced in the repo layer.
 */
export async function saveDiagnosticResults(
  outcomes: DiagnosticSubjectOutcome[],
): Promise<PersistResult> {
  if (!outcomes.length) return { persisted: false, reason: "No outcomes." };

  const parentId = await currentParentId();
  if (!parentId) return { persisted: false, reason: "Not signed in." };

  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { persisted: false, reason: "No child profile yet." };

  // Integrity guard: the diagnostic is one-time. If a baseline already exists
  // (browser back, double-click, late submit), do NOT write a second one —
  // the saved baseline is stable. The completion flag is the atomic lock.
  const existing = await getDiagnosticCompletion(parentId, child._id);
  if (existing.completed) {
    return { persisted: true, reason: "Already completed." };
  }

  // Acquire the set-once lock BEFORE inserting. Only the request that claims it
  // may write the baseline, closing the concurrent/late-submit race.
  const claim = await markDiagnosticCompleted(parentId, child._id);
  if (!claim.claimed || !claim.at) {
    return { persisted: true, reason: "Already completed." };
  }

  let ok = false;
  try {
    ok = await insertEvaluations(
      parentId,
      child._id,
      outcomes.map((o) => ({
        subject: o.subject,
        raw_score: o.readiness,
        model_predicted_grade: gradeFromBand(o.workingGrade),
        confidence_interval: Math.min(0.99, Math.max(0.5, o.readiness / 100)),
        mock_exam: false,
      })),
    );
  } catch {
    await releaseDiagnosticCompletion(parentId, child._id, claim.at);
    return { persisted: false, reason: "Write failed." };
  }

  if (ok) {
    captureServer(parentId, "diagnostic_completed");
  } else {
    await releaseDiagnosticCompletion(parentId, child._id, claim.at);
  }

  return ok
    ? { persisted: true }
    : { persisted: false, reason: "Write was rejected." };
}

function gradeFromBand(band: string): string {
  const matches = band.match(/\d+/g);
  if (!matches?.length) return "4";
  return matches[matches.length - 1];
}
