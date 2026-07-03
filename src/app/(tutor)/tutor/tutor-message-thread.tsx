"use client";

import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { sendTutorMessage, type TutorPortalActionResult } from "./actions";

export interface TutorThreadMessage {
  id: string;
  sender: "parent" | "staff";
  body: string;
  createdAt: string;
}

export function TutorMessageThread({
  bookingId,
  messages,
}: {
  bookingId: string;
  messages: TutorThreadMessage[];
}) {
  const [state, setState] = useState<TutorPortalActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(formData: FormData) {
    setPending(true);
    const result = await sendTutorMessage(formData);
    setPending(false);
    setState(result);
    if (result.ok) formRef.current?.reset();
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-sm font-semibold text-fog-50">Family messages</h3>
      {messages.length === 0 ? (
        <p className="mb-4 text-sm text-fog-500">No messages yet.</p>
      ) : (
        <ul className="mb-4 flex max-h-72 flex-col gap-3 overflow-auto pr-1">
          {messages.map((m) => (
            <li
              key={m.id}
              className={m.sender === "staff" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.sender === "staff"
                    ? "bg-violet-500/20 text-violet-50"
                    : "bg-white/[0.05] text-fog-100",
                ].join(" ")}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide text-fog-500">
                  {m.sender === "staff" ? "You" : "Parent"} ·{" "}
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
      <form ref={formRef} action={submit} className="flex flex-col gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <textarea
          name="body"
          rows={2}
          required
          placeholder="Message the parent..."
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none"
        />
        {state && (
          <p className={`text-xs ${state.ok ? "text-neon-300" : "text-amber-300"}`}>
            {state.ok ? state.message : state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-lg bg-violet-500/20 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </form>
    </div>
  );
}
