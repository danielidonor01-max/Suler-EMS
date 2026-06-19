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
  PAYEBand,
  PayrollComputation,
  SalaryComponents,
} from './types';

/**
 * Apply progressive PAYE bands to a monthly taxable income figure. Bands
 * are now passed in (sourced from the StatutoryRate table by the caller)
 * rather than hardcoded — when omitted, falls back to legacy defaults
 * so old call sites keep working during the rate-service rollout.
 */
export function calculatePAYE(taxableIncome: number, bands?: PAYEBand[]): number {
  if (taxableIncome <= 0) return 0;
  const effective = bands ?? DEFAULT_NG_RATES.payeBands!;
  let tax = 0;
  let remaining = taxableIncome;
  for (const band of effective) {
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
  const paye = calculatePAYE(taxableIncome, rates.payeBands);

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
