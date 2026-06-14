/**
 * Message body validation — pure, shared by parent and staff send paths.
 * Plain text only in Phase 1: trims, rejects empty, caps length.
 */

export const MAX_MESSAGE_CHARS = 2000;

export type MessageValidation =
  | { ok: true; body: string }
  | { ok: false; error: string };

export function validateMessageBody(raw: unknown): MessageValidation {
  if (typeof raw !== "string") {
    return { ok: false, error: "Message must be text." };
  }
  const body = raw.trim();
  if (body.length === 0) {
    return { ok: false, error: "Message can't be empty." };
  }
  if (body.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters).`,
    };
  }
  return { ok: true, body };
}

export type ThreadType = "booking" | "escalation";

export function isThreadType(s: unknown): s is ThreadType {
  return s === "booking" || s === "escalation";
}
