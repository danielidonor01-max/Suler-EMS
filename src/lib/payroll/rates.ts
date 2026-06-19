/**
 * Statutory-rate service. PAYE bands + percentage rates that drive
 * payroll calculations live in the `StatutoryRate` table; this module
 * is the single read/write surface and the canonical default catalogue.
 *
 * Why DB-backed: Nigerian tax law changes (Finance Acts, the 2026 Tax
 * Reform). When PAYE bands shift, HR needs to update them without an
 * engineering cycle. The schema already supported this; nothing read
 * from it. This wires it up.
 *
 * Self-seeding: first read of any code upserts the row with the default
 * below. A fresh database is therefore immediately functional.
 *
 * Caching: same 30-second in-process cache pattern as SystemSetting.
 * Invalidated on write.
 */

import prisma from '@/lib/prisma';

// --- Types --------------------------------------------------------------

export interface PAYEBand {
  /** Width of this band in NGN (monthly). Last band uses Infinity. */
  width: number;
  /** Marginal rate as decimal (e.g. 0.07 for 7%). */
  rate:  number;
}

export interface RuntimeRates {
  payeBands:            PAYEBand[];
  pensionEmployeeRate:  number;
  pensionEmployerRate:  number;
  nhfRate:              number;
  nhisRate:             number;
  craFixed:             number;  // NGN/year
  craPercentage:        number;
}

export type StatutoryCode =
  | 'PAYE_BANDS_MONTHLY'
  | 'PENSION_EMPLOYEE_PCT'
  | 'PENSION_EMPLOYER_PCT'
  | 'NHF_PCT'
  | 'NHIS_PCT'
  | 'CRA_FIXED_ANNUAL'
  | 'CRA_PERCENTAGE';

export interface RateDescriptor {
  code:        StatutoryCode;
  name:        string;
  type:        'BAND' | 'PERCENTAGE' | 'FIXED';
  description: string;
  defaultValue: unknown;
}

// --- Defaults -----------------------------------------------------------

// Monthly PAYE bands. Annual bands ÷ 12, rounded. Width of each band
// is the *additional* NGN above the prior band. Last entry uses
// Number.MAX_SAFE_INTEGER to represent "everything above this".
//
// These widths reflect the legacy Finance Act 2020 bands (the same set
// the code was using before this service existed). Updating them is
// now a settings change, not a code change.
const DEFAULT_PAYE_BANDS_MONTHLY: PAYEBand[] = [
  { width: 25_000,                rate: 0.07 },
  { width: 25_000,                rate: 0.11 },
  { width: 41_666,                rate: 0.15 },
  { width: 41_666,                rate: 0.19 },
  { width: 133_333,               rate: 0.21 },
  { width: Number.MAX_SAFE_INTEGER, rate: 0.24 },
];

export const DEFAULTS: RateDescriptor[] = [
  {
    code:         'PAYE_BANDS_MONTHLY',
    name:         'PAYE Bands (Monthly)',
    type:         'BAND',
    description:  'Progressive PAYE marginal rates, monthly. Each band width is the additional NGN over the prior band.',
    defaultValue: { bands: DEFAULT_PAYE_BANDS_MONTHLY },
  },
  {
    code:         'PENSION_EMPLOYEE_PCT',
    name:         'Pension — Employee Contribution',
    type:         'PERCENTAGE',
    description:  'Employee pension contribution rate. Pension Reform Act 2014 minimum is 8%.',
    defaultValue: { value: 0.08 },
  },
  {
    code:         'PENSION_EMPLOYER_PCT',
    name:         'Pension — Employer Contribution',
    type:         'PERCENTAGE',
    description:  'Employer pension contribution rate. Pension Reform Act 2014 minimum is 10%.',
    defaultValue: { value: 0.10 },
  },
  {
    code:         'NHF_PCT',
    name:         'National Housing Fund (NHF)',
    type:         'PERCENTAGE',
    description:  'NHF Act mandates 2.5% of basic salary for employees earning ≥ ₦3,000/month.',
    defaultValue: { value: 0.025 },
  },
  {
    code:         'NHIS_PCT',
    name:         'NHIS',
    type:         'PERCENTAGE',
    description:  'National Health Insurance Scheme deduction. Most employers carry 5% gross.',
    defaultValue: { value: 0.05 },
  },
  {
    code:         'CRA_FIXED_ANNUAL',
    name:         'Consolidated Relief Allowance — Fixed (NGN/yr)',
    type:         'FIXED',
    description:  'Fixed annual CRA component. Combined with the percentage component for taxable-income reduction.',
    defaultValue: { value: 200_000 },
  },
  {
    code:         'CRA_PERCENTAGE',
    name:         'Consolidated Relief Allowance — Percentage of Gross',
    type:         'PERCENTAGE',
    description:  '20% of annual gross income, added to the fixed CRA.',
    defaultValue: { value: 0.20 },
  },
];

// --- Cache --------------------------------------------------------------

// Same 30s window as SystemSetting. Long enough to absorb a payroll
// run's many computePayroll calls in one shot; short enough that an
// HR update visibly takes effect.
const CACHE_TTL_MS = 30_000;

interface CacheEntry { rates: RuntimeRates; expiresAt: number }
let cache: CacheEntry | null = null;

export function invalidateRatesCache(): void {
  cache = null;
}

// --- Read ---------------------------------------------------------------

function unwrap(type: RateDescriptor['type'], value: unknown): unknown {
  if (type === 'BAND') return (value as { bands: PAYEBand[] }).bands;
  return (value as { value: number }).value;
}

/**
 * Read all active statutory rates as a RuntimeRates object. Self-seeds
 * any missing rows from the DEFAULTS catalogue. Cached for 30s.
 */
export async function getActiveRates(): Promise<RuntimeRates> {
  if (cache && cache.expiresAt > Date.now()) return cache.rates;

  // Single query for every active rate code we care about. We don't
  // bother filtering by effectiveFrom — first-read seeds with
  // effectiveFrom = now, and there's a separate admin path for setting
  // future-dated rates if/when that becomes a requirement.
  const codes = DEFAULTS.map(d => d.code);
  const rows = await prisma.statutoryRate.findMany({
    where: { code: { in: codes }, isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  // First active row per code wins. (We just sorted desc, so first found
  // is the latest.) Anything missing gets seeded with the default.
  const byCode = new Map<string, any>();
  for (const r of rows) if (!byCode.has(r.code)) byCode.set(r.code, r);

  const missing = DEFAULTS.filter(d => !byCode.has(d.code));
  if (missing.length > 0) {
    const seeded = await prisma.$transaction(
      missing.map(d => prisma.statutoryRate.create({
        data: {
          code:          d.code,
          name:          d.name,
          type:          d.type,
          value:         d.defaultValue as any,
          effectiveFrom: new Date(),
          isActive:      true,
        },
      })),
    );
    for (const r of seeded) byCode.set(r.code, r);
  }

  const get = (code: StatutoryCode) => {
    const descriptor = DEFAULTS.find(d => d.code === code)!;
    return unwrap(descriptor.type, byCode.get(code)!.value);
  };

  const rates: RuntimeRates = {
    payeBands:           get('PAYE_BANDS_MONTHLY') as PAYEBand[],
    pensionEmployeeRate: get('PENSION_EMPLOYEE_PCT') as number,
    pensionEmployerRate: get('PENSION_EMPLOYER_PCT') as number,
    nhfRate:             get('NHF_PCT') as number,
    nhisRate:            get('NHIS_PCT') as number,
    craFixed:            get('CRA_FIXED_ANNUAL') as number,
    craPercentage:       get('CRA_PERCENTAGE') as number,
  };

  cache = { rates, expiresAt: Date.now() + CACHE_TTL_MS };
  return rates;
}

/**
 * Admin read — returns every rate row, including descriptor metadata, so
 * the settings UI can render an editable form. Always hits the DB (no
 * cache) so the admin sees authoritative state.
 */
export async function listRateRows() {
  // Make sure every default is seeded so the UI never shows a half-empty
  // table on a fresh database. getActiveRates() also seeds; calling it
  // first lets us reuse the cache later.
  await getActiveRates();

  const rows = await prisma.statutoryRate.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  return DEFAULTS.map(d => {
    const row = rows.find(r => r.code === d.code);
    return {
      code:         d.code,
      name:         d.name,
      type:         d.type,
      description:  d.description,
      row,
    };
  });
}

// --- Write --------------------------------------------------------------

export interface RateUpdate {
  code:  StatutoryCode;
  /** For BAND: an array of PAYEBand. For PERCENTAGE/FIXED: a number. */
  value: PAYEBand[] | number;
}

/**
 * Bulk-update active rates. Each update writes the new value to the row
 * matching `code`. Wraps every update in a single transaction so a
 * partial failure can't leave statutory state half-applied (PAYE bands
 * updated but pension forgotten).
 */
export async function updateRates(updates: RateUpdate[], actorId: string): Promise<void> {
  if (updates.length === 0) return;

  // Validate first so we either commit everything or nothing.
  for (const u of updates) {
    const descriptor = DEFAULTS.find(d => d.code === u.code);
    if (!descriptor) {
      throw new Error(`Unknown statutory code: ${u.code}`);
    }
    if (descriptor.type === 'BAND') {
      if (!Array.isArray(u.value)) {
        throw new Error(`PAYE bands must be an array; got ${typeof u.value}`);
      }
      const bands = u.value as PAYEBand[];
      if (bands.length === 0) throw new Error('PAYE bands cannot be empty');
      for (const b of bands) {
        if (typeof b.width !== 'number' || b.width <= 0) {
          throw new Error('PAYE band width must be a positive number');
        }
        if (typeof b.rate !== 'number' || b.rate < 0 || b.rate > 1) {
          throw new Error('PAYE band rate must be a decimal between 0 and 1');
        }
      }
    } else {
      if (typeof u.value !== 'number' || u.value < 0) {
        throw new Error(`${u.code} must be a non-negative number`);
      }
      if ((descriptor.type === 'PERCENTAGE') && u.value > 1) {
        throw new Error(`${u.code} is a percentage (0-1), got ${u.value}`);
      }
    }
  }

  await prisma.$transaction(updates.map(u => {
    const descriptor = DEFAULTS.find(d => d.code === u.code)!;
    const wrapped = descriptor.type === 'BAND'
      ? { bands: u.value as PAYEBand[] }
      : { value: u.value as number };
    // Wipe the cache reference; we'll re-fetch on next read. Also
    // update the row in place (one rate per code under the
    // current "no future-dated rates" assumption).
    return prisma.statutoryRate.updateMany({
      where: { code: u.code, isActive: true },
      data:  { value: wrapped as any, notes: `Updated by ${actorId}` },
    });
  }));

  invalidateRatesCache();
}
