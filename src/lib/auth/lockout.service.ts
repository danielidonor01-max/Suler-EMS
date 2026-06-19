/**
 * Failed-login lockout. Counts recent failed LoginAttempt rows per
 * email; when the count reaches the configured threshold within the
 * window, the account is considered locked until the lockout duration
 * has elapsed since the most-recent failure.
 *
 * No new schema column needed — we already record every LoginAttempt
 * with a timestamp, so the lockout state is fully derivable from those
 * rows. This keeps the audit story honest (the same data that says
 * "you're locked" is the data HR can review) and means the lockout
 * naturally clears as old failures fall out of the window.
 *
 * On a successful login we don't delete the old failures (audit
 * preservation), but the same window-based count means they stop
 * mattering quickly.
 */

import prisma from '@/lib/prisma';
import { getLockoutPolicy } from '@/lib/settings/service';

export interface LockoutState {
  locked:             boolean;
  retryAfterSeconds:  number; // 0 when not locked
  remainingAttempts:  number; // attempts left before lockout (when not locked)
  policy: {
    maxAttempts:     number;
    windowMinutes:   number;
    durationMinutes: number;
  };
}

/**
 * Evaluate the lockout state for a given email. Pure read — never
 * mutates LoginAttempt; that's done by the existing
 * `AuthService.recordLoginAttempt` call site.
 */
export async function evaluateLockout(email: string): Promise<LockoutState> {
  const policy = await getLockoutPolicy();

  const windowMs   = policy.windowMinutes * 60_000;
  const lockoutMs  = policy.durationMinutes * 60_000;
  const now        = Date.now();
  const windowFrom = new Date(now - windowMs);

  // Pull just the timestamps we need; bounded by the configurable
  // window so this query is cheap regardless of total LoginAttempt
  // volume.
  const recentFailures = await prisma.loginAttempt.findMany({
    where: {
      email,
      success:   false,
      timestamp: { gte: windowFrom },
    },
    orderBy:  { timestamp: 'desc' },
    take:     policy.maxAttempts + 1, // one beyond threshold tells us "ever exceeded"
    select:   { timestamp: true },
  });

  if (recentFailures.length < policy.maxAttempts) {
    return {
      locked:            false,
      retryAfterSeconds: 0,
      remainingAttempts: policy.maxAttempts - recentFailures.length,
      policy,
    };
  }

  // Locked while the most-recent failure is within the lockout window.
  const mostRecent = recentFailures[0].timestamp.getTime();
  const unlockAt   = mostRecent + lockoutMs;
  if (unlockAt <= now) {
    // Threshold was hit historically but the duration has elapsed — the
    // user gets the full attempt budget again.
    return {
      locked:            false,
      retryAfterSeconds: 0,
      remainingAttempts: policy.maxAttempts,
      policy,
    };
  }

  return {
    locked:            true,
    retryAfterSeconds: Math.ceil((unlockAt - now) / 1000),
    remainingAttempts: 0,
    policy,
  };
}

/**
 * Human-friendly message for the lockout error surfaced by NextAuth.
 * Kept here so the same wording reaches the login page and any audit
 * row describing the rejection.
 */
export function lockoutMessage(state: LockoutState): string {
  if (!state.locked) return '';
  const mins = Math.ceil(state.retryAfterSeconds / 60);
  if (mins <= 1) return 'Account is temporarily locked. Try again in under a minute.';
  return `Account is temporarily locked. Try again in about ${mins} minutes.`;
}
