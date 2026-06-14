"use client";

import { useState, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { sendParentMessage } from "@/app/(dashboard)/tutoring/message-actions";
import { MAX_MESSAGE_CHARS } from "@/lib/messaging/validate";
import { EmptyIllustration } from "@/components/fx/empty-illustration";

export interface ThreadMessage {
  id: string;
  sender: "parent" | "staff";
  body: string;
  createdAt: string; // ISO
}

/**
 * Parent-facing message thread for a booking or escalation. Plain text only;
 * posting goes through the rate-limited, ownership-checked server action. The
 * server is the source of truth — after a successful post we revalidate via the
 * action and clear the box.
 */
export function MessageThread({
  threadType,
  threadId,
  initialMessages,
}: {
  threadType: "booking" | "escalation";
  threadId: string;
  initialMessages: ThreadMessage[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await sendParentMessage(formData);
    setPending(false);
    if (res.ok) {
      formRef.current?.reset();
    } else {
      setError(res.error ?? "Could not send.");
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-fog-100">Messages</h4>
      </div>

      {initialMessages.length === 0 ? (
        <div className="mb-4 flex flex-col items-center py-4 text-center">
          <EmptyIllustration name="messages" className="mb-2 h-16 w-16 text-fog-600" />
          <p className="text-sm text-fog-500">
            No messages yet. Send a note and our team will reply here.
          </p>
        </div>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {initialMessages.map((m) => (
            <li
              key={m.id}
              className={m.sender === "parent" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={[
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.sender === "parent"
                    ? "bg-violet-500/20 text-violet-50"
                    : "bg-white/[0.05] text-fog-100",
                ].join(" ")}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide text-fog-500">
                  {m.sender === "parent" ? "You" : "HEXA team"} ·{" "}
                  {new Date(m.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={onSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="threadType" value={threadType} />
        <input type="hidden" name="threadId" value={threadId} />
        <textarea
          name="body"
          rows={2}
          maxLength={MAX_MESSAGE_CHARS}
          required
          placeholder="Write a message to the HEXA team…"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
        />
        {error && <p className="text-xs text-crimson-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-1.5 self-end rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
