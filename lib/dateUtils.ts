/**
 * Date utilities for local date sync, future date locking,
 * midnight rollover detection, and period immutability.
 */

export const LOCKED_FUTURE_PERIOD_PREFIX = '2026-12';

/**
 * Returns client's current local date in ISO format (YYYY-MM-DD)
 * using `new Date().toLocaleDateString('en-CA')`
 */
export function getClientTodayDateISO(): string {
  if (typeof window === 'undefined') {
    return '2026-11-11';
  }
  try {
    return new Date().toLocaleDateString('en-CA');
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Checks if a given date string is in the future relative to today
 */
export function isFutureDate(dateStr: string, referenceToday?: string): boolean {
  const today = referenceToday || getClientTodayDateISO();
  return dateStr > today;
}

/**
 * Checks whether an entire month period (YYYY-MM) is locked.
 * Future periods (e.g. 2026-12 and beyond) are strictly locked and read-only.
 */
export function isPeriodLocked(monthKey: string, currentMonthKey?: string): boolean {
  const current = currentMonthKey || getClientTodayDateISO().slice(0, 7);
  // Any month after current month is locked
  return monthKey > current;
}

/**
 * Determines whether a record is editable based on date rules:
 * - Records cannot have future dates beyond today
 * - Records in locked periods cannot be edited
 */
export function isRecordEditable(dateString: string, maxDate?: string): boolean {
  const today = maxDate || getClientTodayDateISO();
  if (dateString > today) {
    return false;
  }
  const monthKey = dateString.slice(0, 7);
  if (isPeriodLocked(monthKey, today.slice(0, 7))) {
    return false;
  }
  return true;
}

/**
 * Calculates milliseconds remaining until the upcoming midnight
 * to schedule zero-overhead automatic day rollover without manual page refresh.
 */
export function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1,
    0
  );
  return Math.max(1000, nextMidnight.getTime() - now.getTime());
}
