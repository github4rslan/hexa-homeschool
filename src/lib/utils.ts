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
 * Format a duration in minutes into a human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`;
}
