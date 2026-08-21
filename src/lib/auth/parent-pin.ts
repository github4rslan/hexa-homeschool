import "server-only";
import { findParentById } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { normaliseParentPin } from "@/lib/auth/parent-pin-input";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth/client-ip";

export type ParentPinCheck =
  | { ok: true }
  | {
      ok: false;
      error: string;
      setupRequired?: boolean;
    };

/**
 * Canonical parent-PIN verification used by every parent gate. Keeping the
 * validation and bcrypt comparison here prevents security drift between flows.
 *
 * A 4-digit PIN is only 10,000 possible values, and this gate guards the exact
 * "shared-device, lower-trust surface" scenario (a child exiting back to the
 * parent dashboard) that `login`'s own rate limit defends against for the
 * password check. Throttle it the same way: per-IP is the primary control, a
 * looser per-parent bucket blunts a single account being brute-forced from
 * many IPs. Trip → the SAME generic message as any other rejection, so a
 * child guessing never learns they hit a limit rather than a wrong PIN.
 */
export async function verifyParentPin(
  parentId: string,
  rawPin: unknown,
): Promise<ParentPinCheck> {
  const genericError = { ok: false as const, error: "That PIN was not recognised." };

  const ip = await clientIp();
  const [ipGate, parentGate] = await Promise.all([
    rateLimit(`parentpin-ip:${ip}`, 10, 60_000),
    rateLimit(`parentpin-parent:${parentId}`, 10, 15 * 60_000),
  ]);
  if (!ipGate.ok || !parentGate.ok) {
    return genericError;
  }

  const parent = await findParentById(parentId);
  if (!parent) return { ok: false, error: "Please sign in again." };
  if (!parent.parent_pin_hash) {
    return {
      ok: false,
      setupRequired: true,
      error: "Set a parent PIN in Settings before using this parent action.",
    };
  }

  const pin = normaliseParentPin(rawPin);
  if (!pin) {
    return { ok: false, error: "Enter the 4-digit parent PIN." };
  }

  if (!(await verifyPassword(pin, parent.parent_pin_hash))) {
    return genericError;
  }
  return { ok: true };
}
