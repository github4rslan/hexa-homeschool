"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import {
  verifyParentGatePin,
  type ParentGateResult,
} from "@/app/(child)/learn/actions";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

const INITIAL_STATE: ParentGateResult = { ok: false };

export function ParentGateExit({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(verifyParentGatePin, INITIAL_STATE);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useFocusTrap(dialogRef, open, close);

  useEffect(() => {
    if (state.ok) router.push("/dashboard");
  }, [router, state.ok]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          "text-fog-300 hover:text-fog-50 hover:bg-white/5 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Exit
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-void/80 backdrop-blur-sm"
            onClick={close}
            aria-label="Cancel exit"
          />
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-gate-title"
            className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-abyss p-6 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.8)] outline-none"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="parent-gate-title" className="text-xl font-semibold text-fog-50">
                  Parent PIN
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fog-400">
                  Enter the 4-digit PIN to return to the parent dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-fog-300 hover:bg-white/10 hover:text-fog-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
              <input
                name="parent_pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                autoComplete="off"
                className="h-16 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-center text-3xl tracking-[0.4em] text-fog-50 outline-none transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-fog-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
                placeholder="0000"
                aria-label="Parent PIN"
                required
              />
              {state.error && (
                <p className="text-sm text-crimson-300">{state.error}</p>
              )}
              {state.setupRequired && (
                <Link
                  href="/settings"
                  className="text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  Open Settings
                </Link>
              )}
              <SubmitButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-cyan-500 px-6 text-base font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? "Checking..." : "Return to dashboard"}
    </button>
  );
}
