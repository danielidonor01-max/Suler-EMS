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
}

export const DEFAULT_NG_RATES: ComplianceRates = {
  pensionEmployeeRate: 0.08,
  pensionEmployerRate: 0.10,
  nhfRate: 0.025,
  nhisRate: 0.05,
  craFixed: 200_000,
  craPercentage: 0.20,
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
