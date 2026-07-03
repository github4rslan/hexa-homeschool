"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  createQuestion,
  findParentById,
  recordStaffAction,
} from "@/lib/db/repo";
import { can, resolveRole } from "@/lib/auth/rbac";
import type { QuestionDoc, Subject } from "@/lib/db/types";

export type CurriculumActionResult = {
  ok: boolean;
  error?: string;
};

const SUBJECTS: Subject[] = ["mathematics", "english", "science"];
const KINDS: QuestionDoc["kind"][] = ["diagnostic", "practice", "mastery"];

async function requireCurriculumWrite(): Promise<
  { staffId: string; staffEmail: string } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  if (!can(role, "curriculum.write")) {
    return { error: "You don't have permission to edit curriculum." };
  }
  return { staffId: session.id, staffEmail: session.email ?? "staff" };
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asInt(value: FormDataEntryValue | null): number | null {
  const n = Number.parseInt(asString(value), 10);
  return Number.isFinite(n) ? n : null;
}

export async function addCurriculumQuestion(
  _prevState: CurriculumActionResult,
  formData: FormData,
): Promise<CurriculumActionResult> {
  const auth = await requireCurriculumWrite();
  if ("error" in auth) return { ok: false, error: auth.error };

  const topicTag = asString(formData.get("topicTag"));
  const subject = asString(formData.get("subject")) as Subject;
  const kind = asString(formData.get("kind")) as QuestionDoc["kind"];
  const prompt = asString(formData.get("prompt"));
  const explanation = asString(formData.get("explanation"));
  const tier = asInt(formData.get("tier"));
  const keyStage = asInt(formData.get("keyStage"));
  const correctIndex = asInt(formData.get("correctIndex"));
  const options = [0, 1, 2, 3]
    .map((i) => asString(formData.get(`option${i}`)))
    .filter(Boolean);

  if (!topicTag) return { ok: false, error: "Choose a topic." };
  if (!SUBJECTS.includes(subject)) return { ok: false, error: "Invalid subject." };
  if (!KINDS.includes(kind)) return { ok: false, error: "Invalid question type." };
  if (!prompt) return { ok: false, error: "Add the question prompt." };
  if (!explanation) return { ok: false, error: "Add the explanation." };
  if (!tier || tier < 1 || tier > 5) {
    return { ok: false, error: "Tier must be between 1 and 5." };
  }
  if (!keyStage || keyStage < 2 || keyStage > 4) {
    return { ok: false, error: "Key stage must be 2, 3, or 4." };
  }
  if (options.length < 2) {
    return { ok: false, error: "Add at least two answer options." };
  }
  if (correctIndex === null || correctIndex < 0 || correctIndex >= options.length) {
    return { ok: false, error: "Choose a valid correct answer." };
  }

  const question = await createQuestion({
    topicTag,
    subject,
    tier,
    keyStage,
    kind,
    prompt,
    options,
    correctIndex,
    explanation,
  });
  if (!question?._id) {
    return { ok: false, error: "Could not add question for that topic." };
  }

  await recordStaffAction({
    staffId: auth.staffId,
    staffEmail: auth.staffEmail,
    action: "curriculum.question.create",
    targetCollection: "questions",
    targetId: question._id.toHexString(),
    after: JSON.stringify({
      topic_tag: topicTag,
      subject,
      kind,
      tier,
      key_stage: keyStage,
      prompt,
    }),
  });

  revalidatePath("/admin/curriculum");
  redirect(`/admin/curriculum?added=${question._id.toHexString()}#${topicTag}`);
}
