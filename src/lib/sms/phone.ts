/**
 * E.164 phone-number validation — pure, shared by the settings form and the
 * SMS sender. E.164: a leading "+", a non-zero country-code digit, then up to
 * 14 more digits (15 digits total max). We normalise by stripping spaces,
 * hyphens and parentheses before validating.
 */

export interface PhoneValidation {
  ok: boolean;
  /** Normalised E.164 string when ok. */
  value?: string;
  error?: string;
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s().-]/g, "");
}

export function validatePhone(raw: unknown): PhoneValidation {
  if (typeof raw !== "string") return { ok: false, error: "Phone must be text." };
  const value = normalizePhone(raw.trim());
  if (value === "") return { ok: false, error: "Phone number is empty." };
  if (!/^\+[1-9]\d{6,14}$/.test(value)) {
    return {
      ok: false,
      error: "Enter a valid number in international format, e.g. +447700900123.",
    };
  }
  return { ok: true, value };
}
