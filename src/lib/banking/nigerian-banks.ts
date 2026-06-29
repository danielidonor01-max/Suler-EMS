/**
 * NIBSS commercial-bank lookup.
 *
 * The disbursement CSV (/api/payroll/runs/[id]/disbursement) needs the
 * 3-digit NIBSS sort code for each employee's bank. Asking the user to
 * type that code on profile forms is bad UX — they should pick the
 * bank by name and we derive the code internally.
 *
 * Codes verified against NIBSS public bank list. If a bank is missing,
 * add a row here — the picker and the disbursement export read from
 * this single source.
 */

export interface NigerianBank {
  /** Display name used in the picker. */
  name: string;
  /** 3-digit NIBSS sort code stored on the Employee row. */
  code: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: 'Access Bank',                         code: '044' },
  { name: 'Citibank Nigeria',                    code: '023' },
  { name: 'Ecobank Nigeria',                     code: '050' },
  { name: 'Fidelity Bank',                       code: '070' },
  { name: 'First Bank of Nigeria',               code: '011' },
  { name: 'First City Monument Bank (FCMB)',     code: '214' },
  { name: 'Globus Bank',                         code: '103' },
  { name: 'Guaranty Trust Bank (GTBank)',        code: '058' },
  { name: 'Heritage Bank',                       code: '030' },
  { name: 'Jaiz Bank',                           code: '301' },
  { name: 'Keystone Bank',                       code: '082' },
  { name: 'Kuda Microfinance Bank',              code: '50211' },
  { name: 'Lotus Bank',                          code: '303' },
  { name: 'Opay',                                code: '999992' },
  { name: 'PalmPay',                             code: '999991' },
  { name: 'Parallex Bank',                       code: '104' },
  { name: 'Polaris Bank',                        code: '076' },
  { name: 'PremiumTrust Bank',                   code: '105' },
  { name: 'Providus Bank',                       code: '101' },
  { name: 'Stanbic IBTC Bank',                   code: '221' },
  { name: 'Standard Chartered Bank Nigeria',     code: '068' },
  { name: 'Sterling Bank',                       code: '232' },
  { name: 'SunTrust Bank',                       code: '100' },
  { name: 'TAJBank',                             code: '302' },
  { name: 'Titan Trust Bank',                    code: '102' },
  { name: 'Union Bank of Nigeria',               code: '032' },
  { name: 'United Bank for Africa (UBA)',        code: '033' },
  { name: 'Unity Bank',                          code: '215' },
  { name: 'VFD Microfinance Bank',               code: '566' },
  { name: 'Wema Bank',                           code: '035' },
  { name: 'Zenith Bank',                         code: '057' },
];

/** Look up the NIBSS code for a bank name (case-insensitive). */
export function codeForBank(name: string | null | undefined): string | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  const hit = NIGERIAN_BANKS.find(b => b.name.toLowerCase() === needle);
  return hit?.code ?? null;
}
