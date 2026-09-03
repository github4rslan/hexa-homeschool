import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-aware className concatenator.
 * Resolves conflicts and dedupes utility classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with thousand separators (en-GB).
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

/**
 * Format an ISO date ("YYYY-MM-DD", e.g. a weekly-schedule `week_start`) into a
 * friendly UK long date, "20 July 2026". Parsed and formatted in UTC so the
 * calendar day never shifts by timezone. Returns the input unchanged if it
 * isn't a parseable YYYY-MM-DD string (legacy-safe).
 */
export function formatUkDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a Date as "2026-09-03 14:22 UTC" (minute precision, always UTC) for
 * operator-facing text such as the Slack growth pings, the daily digest and
 * outage alerts. Returns "unknown" for a missing or unparseable date so a
 * message never renders "Invalid Date".
 */
export function formatUtcMinute(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return "unknown";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/**
 * Format a duration in minutes into a human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
}
