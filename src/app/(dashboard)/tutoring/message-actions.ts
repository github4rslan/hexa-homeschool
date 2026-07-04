"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getActiveChild,
  getTutorBookingForParent,
  postMessageAsParent,
  markThreadReadByParent,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { validateMessageBody, isThreadType } from "@/lib/messaging/validate";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/email/verification";
import { notifyTutorMessage } from "@/lib/email/tutoring";

export interface PostMessageResult {
  ok: boolean;
  error?: string;
}

/**
 * Parent posts a message to a thread they own. Validates the body, rate-limits
 * per parent, and relies on the repo's ownership check for isolation.
 */
export async function sendParentMessage(formData: FormData): Promise<PostMessageResult> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, error: "Please sign in again." };

  const threadType = formData.get("threadType");
  const threadId = String(formData.get("threadId") || "");
  if (!isThreadType(threadType) || !threadId) {
    return { ok: false, error: "Invalid thread." };
  }

  const valid = validateMessageBody(formData.get("body"));
  if (!valid.ok) return { ok: false, error: valid.error };

  const limited = await rateLimit(`msg:${parentId}`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: "You're sending messages quickly — please wait a moment." };
  }

  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false, error: "No active child." };

  const ok = await postMessageAsParent(
    parentId,
    threadType,
    threadId,
    child._id,
    valid.body,
  );
  if (!ok) return { ok: false, error: "You can only message your own threads." };
  if (threadType === "booking") {
    const detail = await getTutorBookingForParent(parentId, threadId);
    if (detail?.tutorEmail) {
      await notifyTutorMessage({
        to: detail.tutorEmail,
        recipientName: detail.tutorName,
        senderLabel: "A parent",
        sessionUrl: `${appUrl()}/tutor/sessions/${threadId}`,
      });
    }
  }

  revalidatePath("/tutoring");
  return { ok: true };
}

/** Mark a thread's staff messages read (clears the unread badge). */
export async function markThreadRead(
  threadType: string,
  threadId: string,
): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId || !isThreadType(threadType) || !threadId) return;
  await markThreadReadByParent(parentId, threadType, threadId);
  revalidatePath("/tutoring");
}
