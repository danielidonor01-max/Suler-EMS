"use client";

import React, { useState } from 'react';
import {
  FileBarChart2, Download, RefreshCcw, Calendar, Filter,
  FileText, Users, Banknote, Clock, ShieldCheck, BarChart3,
  ChevronRight, CheckCircle2, Loader2, FileSpreadsheet,
  Building2, TrendingUp, AlertCircle
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatCurrency } from '@/lib/utils/formatCurrency';

// ─── Types & Mock Data ─────────────────────────────────────────────────────────
type ReportStatus = 'READY' | 'GENERATING' | 'SCHEDULED' | 'FAILED';

interface Report {
  id: string;
  title: string;
  category: string;
  description: string;
  lastGenerated: string;
  status: ReportStatus;
  format: 'PDF' | 'Excel' | 'Both';
  schedule?: string;
  size?: string;
}

const REPORTS: Report[] = [
  {
    id: 'r001', title: 'Monthly Payroll Summary', category: 'Payroll',
    description: 'Full payroll run breakdown by hub, department, and employee — including PAYE, Pension, NHF deductions.',
    lastGenerated: '2026-05-01T08:00:00Z', status: 'READY', format: 'Both',
    schedule: 'Monthly — 1st', size: '2.4 MB'
  },
  {
    id: 'r002', title: 'Statutory Remittance Report', category: 'Payroll',
    description: 'Consolidated PAYE, Pension (PFA), NHF, and ITF remittance declarations for regulatory submission.',
    lastGenerated: '2026-05-01T08:05:00Z', status: 'READY', format: 'PDF',
    schedule: 'Monthly — 1st', size: '980 KB'
  },
  {
    id: 'r003', title: 'Workforce Headcount Report', category: 'HR',
    description: 'Active employees by hub, department, grade, and employment type. Includes joiners and leavers.',
    lastGenerated: '2026-05-10T09:00:00Z', status: 'READY', format: 'Excel',
    schedule: 'Weekly — Monday', size: '1.1 MB'
  },
  {
    id: 'r004', title: 'Attendance & Punctuality Report', category: 'Attendance',
    description: 'Organization-wide attendance rates, late arrivals, absences, and clock-in patterns.',
    lastGenerated: '2026-05-11T07:00:00Z', status: 'READY', format: 'Both',
    schedule: 'Daily', size: '650 KB'
  },
  {
    id: 'r005', title: 'Budget vs. Actuals Report', category: 'Finance',
    description: 'Budget allocation versus realized spend across all cost centres and operational hubs.',
    lastGenerated: '2026-04-30T18:00:00Z', status: 'READY', format: 'Excel',
    schedule: 'Monthly — Last day', size: '3.2 MB'
  },
  {
    id: 'r006', title: 'Expense Audit Trail', category: 'Finance',
    description: 'Itemized expense log with approval chain, category breakdown, and policy compliance flags.',
    lastGenerated: '2026-05-07T12:00:00Z', status: 'READY', format: 'PDF',
    size: '1.8 MB'
  },
  {
    id: 'r007', title: 'Leave Balance Summary', category: 'HR',
    description: 'Annual, sick, and compassionate leave balances per employee. Includes utilization rates.',
    lastGenerated: '2026-05-11T06:00:00Z', status: 'READY', format: 'Excel',
    schedule: 'Weekly — Monday', size: '720 KB'
  },
  {
    id: 'r008', title: 'Audit & Governance Log', category: 'Governance',
    description: 'Immutable export of all system audit events — role changes, payroll mutations, and access events.',
    lastGenerated: '2026-05-11T15:00:00Z', status: 'READY', format: 'PDF',
    schedule: 'Daily', size: '4.5 MB'
  },
  {
    id: 'r009', title: 'Performance KPI Report', category: 'Performance',
    description: 'Consolidated KPI scorecard export across all employees, including review cycles and ratings.',
    lastGenerated: '2026-04-30T10:00:00Z', status: 'SCHEDULED', format: 'Both',
    schedule: 'Monthly — Last day', size: undefined
  },
  {
    id: 'r010', title: 'Org Chart Export', category: 'HR',
    description: 'Visual organizational hierarchy export in structured data format.',
    lastGenerated: '2026-05-08T14:00:00Z', status: 'READY', format: 'PDF',
    size: '1.2 MB'
  },
];

const CATEGORIES = ['All', 'Payroll', 'HR', 'Finance', 'Attendance', 'Governance', 'Performance'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Payroll: Banknote,
  HR: Users,
  Finance: BarChart3,
  Attendance: Clock,
  Governance: ShieldCheck,
  Performance: TrendingUp,
  All: FileBarChart2,
};

const STATUS_CONFIG: Record<ReportStatus, { icon: React.ElementType; text: string; color: string; bg: string }> = {
  READY:      { icon: CheckCircle2, text: 'Ready', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  GENERATING: { icon: Loader2,      text: 'Generating', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  SCHEDULED:  { icon: Calendar,     text: 'Scheduled', color: 'text-amber-600', bg: 'bg-amber-50' },
  FAILED:     { icon: AlertCircle,  text: 'Failed', color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function ReportsPage() {
  const [category, setCategory] = useState('All');
  const [generating, setGenerating] = useState<string[]>([]);

  const filtered = category === 'All' ? REPORTS : REPORTS.filter(r => r.category === category);
  const ready = REPORTS.filter(r => r.status === 'READY').length;
  const scheduled = REPORTS.filter(r => r.schedule).length;

  const handleGenerate = (id: string) => {
    setGenerating(prev => [...prev, id]);
    setTimeout(() => setGenerating(prev => prev.filter(x => x !== id)), 3000);
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <FileBarChart2 className="w-3 h-3" />
                Enterprise Reporting
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Reports Center
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[500px]">
              Generate, schedule, and download enterprise-grade reports across all operational domains.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all">
              <Calendar className="w-4 h-4" />
              Scheduled Reports
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
              <RefreshCcw className="w-4 h-4" />
              Regenerate All
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Total Reports" value={`${REPORTS.length}`} variant="tonal-info" icon={FileBarChart2} />
        <MetricCard label="Ready to Download" value={`${ready}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Auto-Scheduled" value={`${scheduled}`} variant="tonal-info" icon={Calendar} />
        <MetricCard label="Avg File Size" value="1.9 MB" variant="tonal-warning" icon={FileText} />
      </div>

      {/* ── Category Filter ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICONS[cat] || FileBarChart2;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Reports Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(report => {
          const isGenerating = generating.includes(report.id);
          const statusCfg = STATUS_CONFIG[isGenerating ? 'GENERATING' : report.status];
          const StatusIcon = statusCfg.icon;
          const CatIcon = CATEGORY_ICONS[report.category] || FileBarChart2;

          return (
            <div key={report.id} className="bg-white rounded-[20px] border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{report.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {report.category}
                      </span>
                      {report.schedule && (
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
                          {report.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusCfg.bg} shrink-0`}>
                  <StatusIcon className={`w-3 h-3 ${statusCfg.color} ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${statusCfg.color}`}>
                    {isGenerating ? 'Generating' : statusCfg.text}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[12px] font-medium text-slate-400 leading-relaxed">{report.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 pt-1 border-t border-slate-50">
                <span>Last: {new Date(report.lastGenerated).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {report.size && <span>Size: {report.size}</span>}
                <span className="ml-auto">Format: {report.format}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {report.status === 'READY' && !isGenerating && (
                  <>
                    {(report.format === 'PDF' || report.format === 'Both') && (
                      <button className="flex items-center gap-1.5 px-4 h-9 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-rose-100 transition-all">
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    )}
                    {(report.format === 'Excel' || report.format === 'Both') && (
                      <button className="flex items-center gap-1.5 px-4 h-9 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-100 transition-all">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => handleGenerate(report.id)}
                  disabled={isGenerating}
                  className={`ml-auto flex items-center gap-1.5 px-4 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
                    isGenerating
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                      : 'bg-slate-900 text-white hover:bg-black shadow-sm'
                  }`}
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
