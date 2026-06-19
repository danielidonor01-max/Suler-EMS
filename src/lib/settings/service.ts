/**
 * SystemSettingService — typed accessor for org-wide policy values.
 *
 * Each policy has a canonical default declared inline so a fresh DB or
 * a deleted row doesn't break enforcement. The first read of any key
 * upserts the row with the default value — the catalogue is therefore
 * self-seeding on first call. Subsequent reads come from a 30-second
 * in-process cache to avoid hammering the DB on every password change.
 *
 * Adding a new policy:
 *   1. Add the key + default below in DEFAULTS.
 *   2. Add a typed getter (getPasswordPolicy, getSessionPolicy, etc.)
 *      that calls get<T>(key).
 *   3. Use the getter from the place that enforces it.
 */

import prisma from '@/lib/prisma';

export interface PasswordPolicy {
  minLength:        number; // characters
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers:   boolean;
  requireSymbols:   boolean;
}

export interface SessionPolicy {
  idleTimeoutMinutes: number; // auto-logout after N minutes of no activity
  warnBeforeMinutes:  number; // show "you'll be signed out in…" modal
}

export interface LockoutPolicy {
  maxAttempts:      number; // failed attempts within window that triggers lockout
  windowMinutes:    number; // count window
  durationMinutes:  number; // how long the lockout lasts
}

export interface SettingDescriptor {
  key:        string;
  category:   'SECURITY' | 'COMPLIANCE' | 'WORKSPACE';
  description: string;
  defaultValue: unknown;
}

/**
 * Canonical defaults. Order matters only for display in the UI; reads
 * resolve directly by key.
 */
export const DEFAULTS: SettingDescriptor[] = [
  {
    key:          'security.password.minLength',
    category:     'SECURITY',
    description:  'Minimum length for new passwords (8–32).',
    defaultValue: 10,
  },
  {
    key:          'security.password.requireUppercase',
    category:     'SECURITY',
    description:  'Require at least one uppercase letter in new passwords.',
    defaultValue: true,
  },
  {
    key:          'security.password.requireLowercase',
    category:     'SECURITY',
    description:  'Require at least one lowercase letter in new passwords.',
    defaultValue: true,
  },
  {
    key:          'security.password.requireNumbers',
    category:     'SECURITY',
    description:  'Require at least one digit in new passwords.',
    defaultValue: true,
  },
  {
    key:          'security.password.requireSymbols',
    category:     'SECURITY',
    description:  'Require at least one special character (!@#$%^&*…) in new passwords.',
    defaultValue: false,
  },
  {
    key:          'security.session.idleTimeoutMinutes',
    category:     'SECURITY',
    description:  'Auto sign-out after this many idle minutes (5–240).',
    defaultValue: 30,
  },
  {
    key:          'security.session.warnBeforeMinutes',
    category:     'SECURITY',
    description:  'Show the about-to-sign-out modal this many minutes before timeout.',
    defaultValue: 2,
  },
  {
    key:          'security.lockout.maxAttempts',
    category:     'SECURITY',
    description:  'Failed sign-in attempts within the window that triggers a lockout (3–20).',
    defaultValue: 5,
  },
  {
    key:          'security.lockout.windowMinutes',
    category:     'SECURITY',
    description:  'Time window over which failed attempts are counted (1–60 min).',
    defaultValue: 15,
  },
  {
    key:          'security.lockout.durationMinutes',
    category:     'SECURITY',
    description:  'How long an account stays locked after threshold is hit (5–1440 min).',
    defaultValue: 30,
  },
];

// ─── Cache ───────────────────────────────────────────────────────────────────
// 30s in-process cache. SystemSetting reads run inside hot paths (every
// password change, every session check). Caching for half a minute is a
// fair trade — admins setting a new policy will see it active across
// every server within a minute without a deploy.

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();

function getFromCache<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) return undefined;
  return hit.value as T;
}

function setCache(key: string, value: unknown): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Invalidate the cache for one key. PATCH endpoint calls this after writes. */
export function invalidate(key: string): void {
  cache.delete(key);
}

export function invalidateAll(): void {
  cache.clear();
}

// ─── Core get ────────────────────────────────────────────────────────────────

export async function get<T = unknown>(key: string): Promise<T> {
  const cached = getFromCache<T>(key);
  if (cached !== undefined) return cached;

  const descriptor = DEFAULTS.find(d => d.key === key);
  if (!descriptor) {
    throw new Error(`SystemSetting key "${key}" is not declared in DEFAULTS`);
  }

  // Self-seeding upsert: if the row doesn't exist yet, create it with
  // the default value. If it does, leave it alone.
  const row = await prisma.systemSetting.upsert({
    where:  { key },
    update: {},
    create: {
      key,
      category:    descriptor.category,
      description: descriptor.description,
      value:       descriptor.defaultValue as any,
    },
  });

  setCache(key, row.value);
  return row.value as T;
}

// ─── Typed accessors ────────────────────────────────────────────────────────

export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  const [minLength, requireUppercase, requireLowercase, requireNumbers, requireSymbols] = await Promise.all([
    get<number>('security.password.minLength'),
    get<boolean>('security.password.requireUppercase'),
    get<boolean>('security.password.requireLowercase'),
    get<boolean>('security.password.requireNumbers'),
    get<boolean>('security.password.requireSymbols'),
  ]);
  return { minLength, requireUppercase, requireLowercase, requireNumbers, requireSymbols };
}

export async function getSessionPolicy(): Promise<SessionPolicy> {
  const [idleTimeoutMinutes, warnBeforeMinutes] = await Promise.all([
    get<number>('security.session.idleTimeoutMinutes'),
    get<number>('security.session.warnBeforeMinutes'),
  ]);
  return { idleTimeoutMinutes, warnBeforeMinutes };
}

export async function getLockoutPolicy(): Promise<LockoutPolicy> {
  const [maxAttempts, windowMinutes, durationMinutes] = await Promise.all([
    get<number>('security.lockout.maxAttempts'),
    get<number>('security.lockout.windowMinutes'),
    get<number>('security.lockout.durationMinutes'),
  ]);
  return { maxAttempts, windowMinutes, durationMinutes };
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface PasswordCheckResult {
  ok:     boolean;
  errors: string[]; // empty when ok
}

/** Validate a candidate password against the live policy. */
export async function checkPassword(candidate: string): Promise<PasswordCheckResult> {
  const policy = await getPasswordPolicy();
  const errors: string[] = [];

  if (candidate.length < policy.minLength) {
    errors.push(`Must be at least ${policy.minLength} characters (you supplied ${candidate.length}).`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(candidate)) {
    errors.push('Must include at least one uppercase letter.');
  }
  if (policy.requireLowercase && !/[a-z]/.test(candidate)) {
    errors.push('Must include at least one lowercase letter.');
  }
  if (policy.requireNumbers && !/[0-9]/.test(candidate)) {
    errors.push('Must include at least one digit.');
  }
  if (policy.requireSymbols && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(candidate)) {
    errors.push('Must include at least one special character (!@#$%^&*…).');
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Bound value for a setting before persisting. Clamps numeric ranges so
 * a wild PATCH can't set minLength to 9999 or idleTimeoutMinutes to 0.
 */
export function clampValue(key: string, value: unknown): unknown {
  switch (key) {
    case 'security.password.minLength': {
      const n = Number(value);
      return Math.max(8, Math.min(32, isNaN(n) ? 10 : Math.round(n)));
    }
    case 'security.session.idleTimeoutMinutes': {
      const n = Number(value);
      return Math.max(5, Math.min(240, isNaN(n) ? 30 : Math.round(n)));
    }
    case 'security.session.warnBeforeMinutes': {
      const n = Number(value);
      return Math.max(0, Math.min(30, isNaN(n) ? 2 : Math.round(n)));
    }
    default:
      return value;
  }
}
