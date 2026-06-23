export function normaliseParentPin(value: unknown): string | null {
  const pin = String(value ?? "").trim();
  return /^\d{4}$/.test(pin) ? pin : null;
}
