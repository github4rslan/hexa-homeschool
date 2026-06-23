import "server-only";
import { findParentById } from "@/lib/db/repo";
import { verifyPassword } from "@/lib/auth/password";
import { normaliseParentPin } from "@/lib/auth/parent-pin-input";

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
 */
export async function verifyParentPin(
  parentId: string,
  rawPin: unknown,
): Promise<ParentPinCheck> {
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
    return { ok: false, error: "That PIN was not recognised." };
  }
  return { ok: true };
}
