/**
 * Payroll domain value objects. Plain TypeScript types — no Prisma imports.
 * The persistence layer (repositories) converts between these and Prisma rows.
 *
 * Money is represented as `number` (NGN, two-decimal precision is acceptable
 * because all values fit safely in JS number range). Repositories cast to
 * Prisma.Decimal on write and back on read.
 */

export type Money = number;

export interface OtherAllowance {
  name: string;
  amount: Money;
  taxable: boolean;
}

export interface OtherDeduction {
  name: string;
  amount: Money;
  reason?: string;
}

export interface SalaryComponents {
  basicSalary: Money;
  housingAllowance: Money;
  transportAllowance: Money;
  otherAllowances?: OtherAllowance[];
}

export interface PAYEBand {
  /** Width of this band in NGN (monthly). Last band uses a sentinel large number for "and above". */
  width: number;
  /** Marginal rate as a decimal (e.g. 0.07 for 7%). */
  rate:  number;
}

export interface ComplianceRates {
  /** Employee pension contribution rate, e.g. 0.08 (8%) */
  pensionEmployeeRate: number;
  /** Employer pension contribution rate, e.g. 0.10 (10%) */
  pensionEmployerRate: number;
  /** National Housing Fund rate, e.g. 0.025 (2.5%) */
  nhfRate: number;
  /** NHIS rate, e.g. 0.05 (5%) */
  nhisRate: number;
  /** Consolidated Relief Allowance — fixed component (NGN/yr) */
  craFixed: Money;
  /** CRA percentage of gross, e.g. 0.20 (20%) */
  craPercentage: number;
  /**
   * PAYE bands, monthly. Each entry's `width` is the *additional* NGN over the
   * prior band (cumulative widths apply progressively). Last band's width
   * absorbs the rest with the highest marginal rate.
   *
   * Optional for backwards compatibility — when omitted, callers fall back
   * to the legacy hardcoded constants. New flows should always supply this.
   */
  payeBands?: PAYEBand[];
}

/**
 * Legacy default constants (Finance Act 2020 bands). Preserved so any
 * stale call site that doesn't yet pass rates still computes deterministically.
 * Production code paths now flow through `getActiveRates()` in
 * `src/lib/payroll/rates.ts`, which reads from the StatutoryRate DB table.
 */
export const DEFAULT_NG_RATES: ComplianceRates = {
  pensionEmployeeRate: 0.08,
  pensionEmployerRate: 0.10,
  nhfRate: 0.025,
  nhisRate: 0.05,
  craFixed: 200_000,
  craPercentage: 0.20,
  payeBands: [
    { width: 25_000,                rate: 0.07 },
    { width: 25_000,                rate: 0.11 },
    { width: 41_666,                rate: 0.15 },
    { width: 41_666,                rate: 0.19 },
    { width: 133_333,               rate: 0.21 },
    { width: Number.MAX_SAFE_INTEGER, rate: 0.24 },
  ],
};

export interface PayrollComputation {
  grossPay: Money;
  paye: Money;
  pensionEmployee: Money;
  pensionEmployer: Money;
  nhf: Money;
  nhis: Money;
  otherDeductions: OtherDeduction[];
  totalDeductions: Money;
  netPay: Money;
}

export type PayrollRunStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'PROCESSED'
  | 'CANCELLED';

export type ExpenditureStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED';
