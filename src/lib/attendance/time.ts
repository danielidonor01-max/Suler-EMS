/**
 * Lagos-anchored time helpers for attendance.
 *
 * Vercel runs UTC; Lagos (WAT) is UTC+1 year-round (no DST). Storing
 * AttendanceRecord.date as UTC-midnight-of-the-Lagos-day keeps a single
 * row per Lagos calendar day no matter where on the planet the server
 * sits, and matches what employees see on a Lagos wall clock.
 */

const LAGOS_OFFSET_MS = 1 * 60 * 60 * 1000;

/** UTC-midnight Date representing the current Lagos calendar day. */
export function lagosToday(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate()));
}

/** Lagos hour in 24h format for the given moment. */
export function lagosHour(now: Date = new Date()): number {
  return (now.getUTCHours() + 1) % 24;
}

/**
 * PRESENT vs LATE classification for a clock-in.
 * Anything at or after 09:00 Lagos counts as LATE; configurable later
 * via a SystemSetting row.
 */
export const LATE_HOUR_LAGOS = 9;

export function classifyClockIn(now: Date = new Date()): 'PRESENT' | 'LATE' {
  return lagosHour(now) < LATE_HOUR_LAGOS ? 'PRESENT' : 'LATE';
}

/** Lagos calendar day for an arbitrary date (used in calendar grouping). */
export function lagosDayOf(d: Date): Date {
  return lagosToday(d);
}
