"use client";

import React, { useState, useMemo } from 'react';
import { useAccess } from '@/context/AccessContext';
import { usePayroll } from '@/context/PayrollContext';
import {
  DollarSign, Download, TrendingUp, Eye, EyeOff,
  FileText, ChevronRight, CheckCircle2, Clock
} from 'lucide-react';

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

const statusConfig = {
  PROCESSED: { label: 'Processed', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
  APPROVED: { label: 'Approved', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', icon: CheckCircle2 },
  REVIEWED: { label: 'Under Review', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock },
  DRAFT: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
};

export default function MyPayrollPage() {
  const { user } = useAccess();
  const { payrollRuns } = usePayroll();
  const [hideAmounts, setHideAmounts] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const employeeId = user?.employeeId;

  // Filter payroll runs that include this employee's entry
  const myPayslips = useMemo(() => {
    return payrollRuns
      .map(run => {
        const entry = run.entries.find(e => e.employeeId === employeeId);
        if (!entry) return null;
        return { run, entry };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.run.createdAt).getTime() - new Date(a!.run.createdAt).getTime());
  }, [payrollRuns, employeeId]);

  const latestPayslip = myPayslips[0];
  const totalEarned = myPayslips.reduce((sum, p) => sum + (p?.entry.netPay || 0), 0);

  const mask = (val: string) => hideAmounts ? '••••••' : val;

  const selected = myPayslips.find(p => p?.run.id === selectedRun);

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Payslips</h1>
            <p className="text-[13px] font-medium text-slate-400 mt-1">
              <span className="text-slate-600 font-bold">{user?.name || 'Employee'}</span> · Personal salary &amp; deductions history
            </p>
          </div>
          <button
            onClick={() => setHideAmounts(h => !h)}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 hover:border-slate-300 transition-all uppercase tracking-widest"
          >
            {hideAmounts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideAmounts ? 'Show Amounts' : 'Hide Amounts'}
          </button>
        </div>

        {myPayslips.length === 0 ? (
          /* Empty state - no payroll runs yet */
          <div className="p-16 border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <DollarSign className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Payslips Available</h3>
            <p className="text-[13px] text-slate-400 max-w-xs mt-1">
              Your payslips will appear here once the payroll administrator has processed a payroll run and your employee record ({employeeId || 'pending'}) is included.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Hero */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Latest Net Pay</p>
                  <p className="text-3xl font-black text-white mt-2">{mask(formatNGN(latestPayslip?.entry.netPay || 0))}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{latestPayslip?.run.period}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Latest Gross Pay</p>
                  <p className="text-3xl font-black text-white mt-2">{mask(formatNGN(latestPayslip?.entry.grossPay || 0))}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Before deductions</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Total YTD Earned</p>
                  <p className="text-3xl font-black text-emerald-400 mt-2">{mask(formatNGN(totalEarned))}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{myPayslips.length} payslip{myPayslips.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Payslip List */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Payslip History</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {myPayslips.map((p) => {
                  if (!p) return null;
                  const cfg = statusConfig[p.run.status] || statusConfig.DRAFT;
                  const StatusIcon = cfg.icon;
                  const isOpen = selectedRun === p.run.id;
                  return (
                    <div key={p.run.id}>
                      <button
                        onClick={() => setSelectedRun(isOpen ? null : p.run.id)}
                        className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50/60 transition-colors group"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center ${cfg.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-[14px] font-black text-slate-900">{p.run.period}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Gross: {mask(formatNGN(p.entry.grossPay))} · Net: {mask(formatNGN(p.entry.netPay))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expandable payslip detail */}
                      {isOpen && (
                        <div className="px-7 pb-7 bg-slate-50/40 border-t border-slate-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                            {[
                              { label: 'Base Salary', value: p.entry.baseSalary },
                              { label: 'Allowances', value: p.entry.totalAllowances },
                              { label: 'Bonuses', value: p.entry.totalBonuses },
                              { label: 'Gross Pay', value: p.entry.grossPay },
                              { label: 'PAYE Tax', value: p.entry.paye, isDeduction: true },
                              { label: 'Pension (8%)', value: p.entry.pension, isDeduction: true },
                              { label: 'NHF', value: p.entry.nhf, isDeduction: true },
                              { label: 'Net Pay', value: p.entry.netPay, isNet: true },
                            ].map((item) => (
                              <div key={item.label} className={`p-4 rounded-xl border ${item.isNet ? 'bg-emerald-50 border-emerald-100' : item.isDeduction ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</p>
                                <p className={`text-[15px] font-black ${item.isNet ? 'text-emerald-700' : item.isDeduction ? 'text-red-600' : 'text-slate-900'}`}>
                                  {mask(formatNGN(item.value))}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button className="flex items-center gap-2 px-5 h-9 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors">
                              <Download className="w-3.5 h-3.5" /> Download PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tax Overview */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-7 shadow-sm">
              <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest mb-5">Latest Pay Breakdown</h2>
              {latestPayslip && (
                <div className="space-y-3">
                  {[
                    { label: 'Gross Pay', value: latestPayslip.entry.grossPay, width: 100, color: 'bg-indigo-500' },
                    { label: 'PAYE Tax', value: latestPayslip.entry.paye, width: Math.round((latestPayslip.entry.paye / latestPayslip.entry.grossPay) * 100), color: 'bg-red-400' },
                    { label: 'Pension', value: latestPayslip.entry.pension, width: Math.round((latestPayslip.entry.pension / latestPayslip.entry.grossPay) * 100), color: 'bg-amber-400' },
                    { label: 'Net Pay', value: latestPayslip.entry.netPay, width: Math.round((latestPayslip.entry.netPay / latestPayslip.entry.grossPay) * 100), color: 'bg-emerald-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="w-20 text-[11px] font-bold text-slate-500 shrink-0">{item.label}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.width}%` }} />
                      </div>
                      <span className="w-28 text-right text-[12px] font-bold text-slate-900">{mask(formatNGN(item.value))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
