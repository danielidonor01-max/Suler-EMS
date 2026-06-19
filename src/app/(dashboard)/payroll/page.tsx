"use client";

import React from 'react';
import Link from 'next/link';
import {
  Banknote, ShieldCheck, TrendingUp, ArrowRight, Zap,
  PieChart, FileText, Activity, ChevronRight, Calculator,
  Scale, Users, History,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface PayrollRunRow {
  id: string;
  name: string;
  period: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PROCESSED' | 'CANCELLED';
  totalGross: string | number;
  totalNet: string | number;
  totalDeductions: string | number;
  totalEmployerContrib: string | number;
  entryCount: number;
  createdAt: string;
  approvedAt: string | null;
  processedAt: string | null;
  department: { id: string; name: string; code: string } | null;
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-700 border-slate-200',
  REVIEW:    'bg-amber-50 text-amber-700 border-amber-100',
  APPROVED:  'bg-sky-50 text-sky-700 border-sky-100',
  PROCESSED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function PayrollOverviewPage() {
  const { userRole } = useAccess();
  const isFinanceAdmin = userRole === 'FINANCE_MANAGER' || userRole === 'SUPER_ADMIN';

  // Load the 20 most recent runs from the API. Auto-revalidates every 30s.
  const { data: runs = [] } = useApi<PayrollRunRow[]>(
    '/api/payroll/runs?limit=20',
    { pollMs: 30_000 },
  );

  // Compute headline KPIs from the most recent PROCESSED run — that's
  // the authoritative "what we just paid out". Falls back to the
  // latest run of any status if nothing's processed yet (fresh org).
  const processedRuns = runs.filter(r => r.status === 'PROCESSED');
  const latestRun = processedRuns[0] ?? runs[0];

  const totalGross   = latestRun ? num(latestRun.totalGross) : 0;
  const totalNet     = latestRun ? num(latestRun.totalNet) : 0;
  const totalEmpPen  = latestRun ? num(latestRun.totalEmployerContrib) : 0;
  // We don't have the PAYE / employee-pension split on the run row;
  // those live on PayrollEntry. Deductions covers the aggregate for the
  // dashboard view; clicking through to the run gives the breakdown.
  const totalDed     = latestRun ? num(latestRun.totalDeductions) : 0;

  const quickLinks = [
    { name: 'Payroll Runs',       icon: FileText, href: '/payroll/register',         desc: 'Initialize, review, approve, and process payroll cycles.' },
    { name: 'Salary Structures',  icon: Users,    href: '/payroll/salary-structures', desc: 'Per-employee comp definitions — basic, allowances, history.' },
    { name: 'Statutory Rates',    icon: Scale,    href: '/payroll/statutory-rates',  desc: 'PAYE bands, pension, NHF, NHIS, CRA.' },
    { name: 'Audit Registry',     icon: History,  href: '/governance',                desc: 'Immutable trail of every payroll mutation.' },
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Banknote className="w-3 h-3" />
                Payroll
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Payroll Governance
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[540px]">
              Nigerian salary administration: structures, statutory deductions, run lifecycle, and bank disbursement.
            </p>
          </div>
          {isFinanceAdmin && (
            <Link
              href="/payroll/register"
              className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Zap className="w-4 h-4" />
              Initialize Next Cycle
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Latest Gross"        value={formatCurrency(totalGross)} icon={PieChart}     variant="tonal-info" />
        <MetricCard label="Latest Net Paid"     value={formatCurrency(totalNet)}   icon={TrendingUp}   variant="tonal-success" />
        <MetricCard label="Latest Deductions"   value={formatCurrency(totalDed)}   icon={Calculator}   variant="tonal-warning" />
        <MetricCard label="Employer Pension"    value={formatCurrency(totalEmpPen)} icon={ShieldCheck} variant="tonal-info" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map(link => (
          <Link
            key={link.name}
            href={link.href}
            className="bg-white p-6 rounded-[20px] border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all mb-4">
              <link.icon className="w-5 h-5" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-1 group-hover:text-indigo-600">{link.name}</h3>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-4">{link.desc}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100">
              Open <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent runs */}
      <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Recent Runs</h2>
          </div>
          <Link href="/payroll/register" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
            All runs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-[13px] text-slate-500">No payroll runs yet.</p>
            {isFinanceAdmin && (
              <Link
                href="/payroll/register"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
              >
                <Zap className="w-3.5 h-3.5" />
                Initialize First Cycle
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.slice(0, 10).map(run => (
              <Link
                key={run.id}
                href={`/payroll/runs/${run.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-slate-900 truncate">{run.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${STATUS_STYLES[run.status]}`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {run.period} · {run.entryCount} entries
                    {run.department && ` · ${run.department.name}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net</div>
                  <div className="text-[13px] font-bold text-emerald-700">{formatCurrency(num(run.totalNet))}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {isFinanceAdmin && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900">Statutory rates are DB-backed</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">PAYE bands, pension, NHF, NHIS, CRA — editable without a redeploy.</p>
            </div>
          </div>
          <Link
            href="/payroll/statutory-rates"
            className="h-11 px-5 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            Manage Rates <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

    </div>
  );
}
