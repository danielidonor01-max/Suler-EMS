/**
 * Pure payroll calculations. No I/O, no Prisma, no React. Deterministic given
 * inputs — same inputs always yield the same outputs. Tested in isolation.
 *
 * Lifted from PayrollContext.tsx so that API routes, background jobs (Inngest),
 * and UI previews all share one source of truth for payroll math.
 */

import {
  ComplianceRates,
  DEFAULT_NG_RATES,
  OtherDeduction,
  PayrollComputation,
  SalaryComponents,
} from './types';

/** Nigerian PAYE bands (cumulative on monthly taxable income). */
const PAYE_BANDS: Array<{ width: number; rate: number }> = [
  { width: 25_000, rate: 0.07 },
  { width: 25_000, rate: 0.11 },
  { width: 41_666, rate: 0.15 },
  { width: 41_666, rate: 0.19 },
  { width: 133_333, rate: 0.21 },
  { width: Infinity, rate: 0.24 },
];

export function calculatePAYE(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let remaining = taxableIncome;
  for (const band of PAYE_BANDS) {
    const inBand = Math.min(remaining, band.width);
    tax += inBand * band.rate;
    remaining -= inBand;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

export interface ComputePayrollInput {
  salary: SalaryComponents;
  /** Bonus / overtime / commission added on top of base (taxable). */
  bonuses?: number;
  /** Reimbursements (non-taxable add-back, NOT counted in gross). */
  reimbursements?: number;
  /** Arbitrary one-off deductions (advances, garnishments, etc.). */
  otherDeductions?: OtherDeduction[];
  rates?: ComplianceRates;
}

/**
 * Compute one employee's monthly payroll. Returns an immutable snapshot suitable
 * for persistence on a `PayrollEntry`. Caller is responsible for storing the
 * `rateSnapshot` on the parent `PayrollRun` for audit reconstruction.
 */
export function computePayroll(input: ComputePayrollInput): PayrollComputation {
  const rates = input.rates ?? DEFAULT_NG_RATES;
  const { basicSalary, housingAllowance, transportAllowance, otherAllowances = [] } = input.salary;
  const bonuses = input.bonuses ?? 0;
  const otherDeductions = input.otherDeductions ?? [];

  const taxableExtras = otherAllowances.filter(a => a.taxable).reduce((s, a) => s + a.amount, 0);
  const nonTaxableExtras = otherAllowances.filter(a => !a.taxable).reduce((s, a) => s + a.amount, 0);

  const grossPay = basicSalary + housingAllowance + transportAllowance + taxableExtras + nonTaxableExtras + bonuses;

  // Pension is computed on (basic + housing + transport) per Nigerian Pension Reform Act.
  const pensionBase = basicSalary + housingAllowance + transportAllowance;
  const pensionEmployee = Math.round(pensionBase * rates.pensionEmployeeRate);
  const pensionEmployer = Math.round(pensionBase * rates.pensionEmployerRate);

  // NHF is on basic salary only.
  const nhf = Math.round(basicSalary * rates.nhfRate);

  // NHIS on gross (employer-borne in many cases; here we treat as employee deduction for net display).
  const nhis = Math.round(grossPay * rates.nhisRate);

  // Consolidated Relief Allowance (CRA) — annualized then back to monthly for taxable base.
  const annualGross = grossPay * 12;
  const craAnnual = Math.max(rates.craFixed, annualGross * 0.01) + annualGross * rates.craPercentage;
  const craMonthly = Math.round(craAnnual / 12);

  const taxableIncome = Math.max(0, grossPay - craMonthly - pensionEmployee - nhf);
  const paye = calculatePAYE(taxableIncome);

  const otherDeductionsTotal = otherDeductions.reduce((s, d) => s + d.amount, 0);
  const totalDeductions = paye + pensionEmployee + nhf + nhis + otherDeductionsTotal;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    grossPay,
    paye,
    pensionEmployee,
    pensionEmployer,
    nhf,
    nhis,
    otherDeductions,
    totalDeductions,
    netPay,
  };
}
