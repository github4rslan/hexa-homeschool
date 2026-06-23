"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { RotateCcw, ShieldCheck, X } from "lucide-react";
import {
  restartDiagnosticAction,
  verifyDiagnosticRestartPin,
  type RestartDiagnosticState,
} from "@/app/(dashboard)/onboarding/diagnostic/actions";
import { useFocusTrap } from "@/lib/use-focus-trap";

const INITIAL_STATE: RestartDiagnosticState = { ok: false };

export function DiagnosticRestart({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pin" | "confirm">("pin");
  const [pin, setPin] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pinState, verifyAction] = useActionState(
    verifyDiagnosticRestartPin,
    INITIAL_STATE,
  );
  const restart = restartDiagnosticAction.bind(null, childId);
  const [restartState, restartAction] = useActionState(restart, INITIAL_STATE);
  const close = useCallback(() => {
    setOpen(false);
    setStep("pin");
    setPin("");
  }, []);

  useFocusTrap(dialogRef, open, close);

  useEffect(() => {
    if (pinState.ok) setStep("confirm");
  }, [pinState.ok]);

  useEffect(() => {
    if (!restartState.ok) return;
    close();
    router.refresh();
  }, [close, restartState.ok, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/5 px-5 py-3 text-sm font-medium text-amber-200 transition-colors hover:border-amber-400/60 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        <RotateCcw className="h-4 w-4" />
        Restart assessment
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-void/80 backdrop-blur-sm"
            onClick={close}
            aria-label="Cancel assessment restart"
          />
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="restart-assessment-title"
            className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-abyss p-6 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.8)] outline-none"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
                  <ShieldCheck className="h-5 w-5 text-amber-200" />
                </div>
                <h2
                  id="restart-assessment-title"
                  className="text-xl font-semibold text-fog-50"
                >
                  Parent action
                </h2>
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

            {step === "pin" ? (
              <form action={verifyAction} className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-fog-300">
                  Enter your 4-digit parent PIN to manage {childName}&apos;s
                  assessment.
                </p>
                <input
                  name="parent_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  autoComplete="off"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  className="h-16 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-center text-3xl tracking-[0.4em] text-fog-50 outline-none transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-fog-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
                  placeholder="0000"
                  aria-label="Parent PIN"
                  required
                />
                {pinState.error && (
                  <p className="text-sm text-crimson-300">{pinState.error}</p>
                )}
                {pinState.setupRequired && (
                  <Link
                    href="/settings#parent-pin"
                    className="text-sm font-medium text-violet-300 hover:text-violet-200"
                  >
                    Set a parent PIN in Settings
                  </Link>
                )}
                <PendingButton idle="Continue" pending="Checking..." />
              </form>
            ) : (
              <form action={restartAction} className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-fog-200">
                  This starts {childName}&apos;s assessment over. Their new
                  results will replace the old baseline. Mock-exam history will
                  stay saved.
                </p>
                <input type="hidden" name="parent_pin" value={pin} />
                <input
                  type="hidden"
                  name="confirm_restart"
                  value="replace-baseline"
                />
                {restartState.error && (
                  <p className="text-sm text-crimson-300">
                    {restartState.error}
                  </p>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="h-12 rounded-xl border border-white/10 px-5 text-sm font-medium text-fog-200 hover:bg-white/5"
                  >
                    Keep saved baseline
                  </button>
                  <PendingButton
                    idle="Restart assessment"
                    pending="Restarting..."
                    danger
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PendingButton({
  idle,
  pending,
  danger = false,
}: {
  idle: string;
  pending: string;
  danger?: boolean;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={isPending}
      className={
        danger
          ? "h-12 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-void hover:bg-amber-400 disabled:opacity-60"
          : "h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
      }
    >
      {isPending ? pending : idle}
    </button>
  );
}
