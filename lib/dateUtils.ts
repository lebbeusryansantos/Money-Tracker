/**
 * Date utilities for local date sync, future date locking,
 * midnight rollover detection, and period immutability.
 */

export const TIME_FEATURE_START_DATE = '2026-11-12';
export const LOCKED_DECEMBER_ONWARDS = '2026-12';
export const MAX_ALLOWED_DATE = '2026-11-30';

/**
 * Returns client's current local date in ISO format (YYYY-MM-DD)
 * capped at MAX_ALLOWED_DATE if past November 2026.
 */
export function getClientTodayDateISO(): string {
  if (typeof window === 'undefined') {
    return '2026-11-11';
  }
  try {
    const local = new Date().toLocaleDateString('en-CA');
    return local;
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns current client time in HH:MM format (24-hour)
 */
export function getCurrentTimeHHMM(): string {
  if (typeof window === 'undefined') {
    return '12:00';
  }
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats HH:MM into a human-readable 12-hour string (e.g. "2:30 PM")
 */
export function formatTimeDisplay(timeStr?: string, timestamp?: number): string {
  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  }
  if (timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}

/**
 * Determines whether the timing feature is active.
 * Only implemented on November 12, 2026 onwards.
 * For November 11, 2026 and before, time is ignored.
 */
export function isTimeFeatureEnabled(dateStr: string): boolean {
  return dateStr >= TIME_FEATURE_START_DATE;
}

/**
 * Checks whether a month key (YYYY-MM) or date is December 2026 or later.
 * December 2026 onwards is strictly locked (no typing, no button access).
 */
export function isDecemberOnwards(monthOrDate: string): boolean {
  const key = monthOrDate.slice(0, 7);
  return key >= LOCKED_DECEMBER_ONWARDS;
}

/**
 * Checks if a given date string is in the future relative to today
 */
export function isFutureDate(dateStr: string, referenceToday?: string): boolean {
  if (isDecemberOnwards(dateStr)) return true;
  const today = referenceToday || getClientTodayDateISO();
  return dateStr > today;
}

/**
 * Checks whether an entire month period (YYYY-MM) is locked.
 * December 2026 and future periods are strictly locked and read-only.
 */
export function isPeriodLocked(monthKey: string, currentMonthKey?: string): boolean {
  if (isDecemberOnwards(monthKey)) return true;
  const current = currentMonthKey || getClientTodayDateISO().slice(0, 7);
  return monthKey > current;
}

/**
 * Determines whether a record is editable based on date rules:
 * - December 2026 onwards is completely locked
 * - Records cannot have future dates beyond today
 */
export function isRecordEditable(dateString: string, maxDate?: string): boolean {
  if (isDecemberOnwards(dateString)) {
    return false;
  }
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
 * Calculates milliseconds remaining until upcoming midnight
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
