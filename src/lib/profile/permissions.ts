/**
 * Profile capability checks shared between the core profile route and
 * the extras route. Both endpoints must agree on who sees what — moving
 * these into one place keeps them honest.
 */

interface ProfileSession {
  user: {
    role:         string;
    permissions?: string[];
    employeeId?:  string | null;
  };
}

export function canEditOthers(session: ProfileSession): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export function canViewCompliance(session: ProfileSession, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  return session.user.employeeId === employeeId;
}

/**
 * Banking visibility: HR + owner. Account numbers are sensitive enough
 * that a generic permission like `payroll:view` shouldn't unlock them —
 * Finance reads them via the disbursement export endpoint instead.
 */
export function canViewBanking(session: ProfileSession, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  return session.user.employeeId === employeeId;
}

export function canEditBanking(session: ProfileSession): boolean {
  if (canEditOthers(session)) return true;
  return (session.user.permissions ?? []).includes('payroll:edit');
}

/**
 * Compensation visibility: HR + owner + anyone with payroll:view. Salary
 * figures are routinely needed by Finance and managers in performance
 * review prep, so the threshold is lower than for bank details.
 */
export function canViewCompensation(session: ProfileSession, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  if ((session.user.permissions ?? []).includes('payroll:view')) return true;
  if ((session.user.permissions ?? []).includes('payroll:edit')) return true;
  return session.user.employeeId === employeeId;
}

/**
 * Activity timeline visibility: HR + owner. The timeline reveals
 * historical change patterns that aren't part of the public profile.
 */
export function canViewActivity(session: ProfileSession, employeeId: string): boolean {
  if (canEditOthers(session)) return true;
  return session.user.employeeId === employeeId;
}

export function maskField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

/** Inclusive days of `req` that fall inside [windowStart, windowEnd]. */
export function clippedDays(reqStart: Date, reqEnd: Date, windowStart: Date, windowEnd: Date): number {
  const s = reqStart > windowStart ? reqStart : windowStart;
  const e = reqEnd   < windowEnd   ? reqEnd   : windowEnd;
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}
