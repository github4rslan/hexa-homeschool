/**
 * Small helpers for interpreting MongoDB driver errors, kept pure so the
 * race-handling paths that depend on them are unit testable.
 */

/**
 * True when `err` is a MongoDB duplicate-key error (E11000). Used to turn a
 * lost insert race against a unique index into a graceful "already exists"
 * outcome instead of an unhandled 500.
 */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}
