'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Banknote, ChevronDown, ChevronRight, Calendar, Download } from 'lucide-react';
import { apiFetcher } from '@/lib/api/fetcher';

interface PayslipRow {
  id: string;
  basicSalary: string | number;
  housingAllowance: string | number;
  transportAllowance: string | number;
  grossPay: string | number;
  paye: string | number;
  pensionEmployee: string | number;
  pensionEmployer: string | number;
  nhf: string | number;
  nhis: string | number;
  totalDeductions: string | number;
  netPay: string | number;
  notes?: string | null;
  run: { id: string; name: string; period: string; processedAt: string | null };
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function fmt(v: string | number) {
  return `₦${num(v).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function MyPayrollPage() {
  const { data, error, isLoading } = useSWR<PayslipRow[]>('/api/payroll/me', apiFetcher, {
    refreshInterval: 60_000,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const payslips = (data ?? []).slice().sort((a, b) => b.run.period.localeCompare(a.run.period));
  const ytd = payslips
    .filter(p => p.run.period.startsWith(new Date().getFullYear().toString()))
    .reduce((acc, p) => ({
      gross: acc.gross + num(p.grossPay),
      net: acc.net + num(p.netPay),
      paye: acc.paye + num(p.paye),
      pension: acc.pension + num(p.pensionEmployee),
    }), { gross: 0, net: 0, paye: 0, pension: 0 });

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Payslips</h1>
          <p className="text-slate-500 text-[14px] mt-2">Your processed payroll history. Only finalized runs appear here.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">YTD Net</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(ytd.net)}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">YTD Gross</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(ytd.gross)}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">YTD PAYE</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(ytd.paye)}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">YTD Pension</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{fmt(ytd.pension)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 border border-slate-200 rounded-[24px] text-center text-[13px] text-slate-500">Loading payslips…</div>
        ) : error ? (
          <div className="p-12 border border-rose-200 bg-rose-50 rounded-[24px] text-center text-[13px] text-rose-700">Could not load payslips: {error.message}</div>
        ) : payslips.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No payslips yet</h3>
            <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">Your first payslip will appear here once a payroll run that includes you is processed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payslips.map(p => {
              const open = expandedId === p.id;
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-[20px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : p.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">{p.run.period}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.run.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net</div>
                        <div className="text-[15px] font-bold text-emerald-700">{fmt(p.netPay)}</div>
                      </div>
                      {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {open && (
                    <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                      <div className="col-span-2 flex justify-end">
                        <a
                          href={`/api/payroll/me/payslip/${p.id}`}
                          aria-label={`Download payslip for ${p.run.period}`}
                          className="inline-flex items-center gap-2 h-[32px] px-3 rounded-[10px] bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </a>
                      </div>
                      <PayslipRowLine label="Basic Salary" value={fmt(p.basicSalary)} />
                      <PayslipRowLine label="Housing" value={fmt(p.housingAllowance)} />
                      <PayslipRowLine label="Transport" value={fmt(p.transportAllowance)} />
                      <PayslipRowLine label="Gross Pay" value={fmt(p.grossPay)} bold />
                      <div className="col-span-2 border-t border-slate-100 my-2" />
                      <PayslipRowLine label="PAYE" value={`− ${fmt(p.paye)}`} muted />
                      <PayslipRowLine label="Pension (employee)" value={`− ${fmt(p.pensionEmployee)}`} muted />
                      <PayslipRowLine label="NHF" value={`− ${fmt(p.nhf)}`} muted />
                      <PayslipRowLine label="NHIS" value={`− ${fmt(p.nhis)}`} muted />
                      <PayslipRowLine label="Total Deductions" value={fmt(p.totalDeductions)} bold />
                      <div className="col-span-2 border-t border-slate-100 my-2" />
                      <PayslipRowLine label="Net Pay" value={fmt(p.netPay)} bold className="text-emerald-700" />
                      <PayslipRowLine label="Employer Pension" value={fmt(p.pensionEmployer)} muted />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PayslipRowLine({ label, value, muted, bold, className }: { label: string; value: string; muted?: boolean; bold?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? 'text-slate-500' : 'text-slate-700'} text-[12px]`}>{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${className ?? 'text-slate-900'}`}>{value}</span>
    </div>
  );
}
