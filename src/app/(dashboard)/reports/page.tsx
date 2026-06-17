"use client";

import React, { useState } from 'react';
import {
  FileBarChart2, Download, RefreshCcw, Calendar, FileText, Users,
  ShieldCheck, CheckCircle2, Loader2, BarChart3, AlertCircle, Clock,
  TrendingUp,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

// ─── Templates (the catalogue the user picks from) ───────────────────────────
// Mirrors src/lib/reports/generators.ts REGISTRY. Adding a new generator
// there: also add its template here so the UI surfaces it.
interface Template {
  type: 'WORKFORCE_HEADCOUNT' | 'LEAVE_BALANCE' | 'AUDIT_LOG';
  title: string;
  description: string;
  category: string;
}

const TEMPLATES: Template[] = [
  {
    type: 'WORKFORCE_HEADCOUNT',
    title: 'Workforce Headcount',
    description: 'All active and suspended employees with hub, department, role, status, and join date.',
    category: 'HR',
  },
  {
    type: 'LEAVE_BALANCE',
    title: 'Leave Balance Summary',
    description: 'Per-employee quota / used / remaining for every active leave type. One row per employee × type for Excel pivot.',
    category: 'HR',
  },
  {
    type: 'AUDIT_LOG',
    title: 'Audit & Governance Log',
    description: 'Workflow transitions + security events from the last 30 days, merged into one chronological feed.',
    category: 'Governance',
  },
];

const CATEGORIES = ['All', 'HR', 'Governance'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  HR: Users,
  Governance: ShieldCheck,
  Performance: TrendingUp,
  Finance: BarChart3,
  All: FileBarChart2,
};

// ─── API job shape ───────────────────────────────────────────────────────────

interface ReportJob {
  id: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'ARCHIVED';
  format: string;
  fileName: string | null;
  error: string | null;
  failureCategory: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  user?: { id: string; name: string; email: string };
}

const STATUS_TONE: Record<string, { text: string; bg: string }> = {
  COMPLETED:  { text: 'text-emerald-600', bg: 'bg-emerald-50' },
  PROCESSING: { text: 'text-indigo-600',  bg: 'bg-indigo-50' },
  PENDING:    { text: 'text-amber-600',   bg: 'bg-amber-50' },
  FAILED:     { text: 'text-rose-600',    bg: 'bg-rose-50' },
  EXPIRED:    { text: 'text-slate-500',   bg: 'bg-slate-50' },
  ARCHIVED:   { text: 'text-slate-500',   bg: 'bg-slate-50' },
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function ReportsPage() {
  const [category, setCategory] = useState('All');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: jobs = [], refresh } = useApi<ReportJob[]>('/api/reports', { pollMs: 15_000 });

  const filtered = category === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);

  const completed = jobs.filter(j => j.status === 'COMPLETED').length;
  const processing = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'PENDING').length;

  const handleGenerate = async (type: string) => {
    setBusy(type);
    setError(null);
    try {
      await apiMutate('/api/reports', 'POST', { type });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
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
              Generate live reports straight from the database. Reports expire after 30 days; regenerate any time.
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Templates" value={`${TEMPLATES.length}`} variant="tonal-info" icon={FileBarChart2} />
        <MetricCard label="Completed (recent)" value={`${completed}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="In Progress" value={`${processing}`} variant="tonal-warning" icon={Loader2} />
        <MetricCard label="Total Runs" value={`${jobs.length}`} variant="tonal-info" icon={Clock} />
      </div>

      {/* ── Category Filter ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICONS[cat] || FileBarChart2;
          return (
            <button
              key={cat}
              type="button"
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

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{error}</span>
        </div>
      )}

      {/* ── Templates ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(t => {
          const CatIcon = CATEGORY_ICONS[t.category] || FileBarChart2;
          const isGenerating = busy === t.type;
          return (
            <div key={t.type} className="bg-white rounded-[20px] border border-slate-200 p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <CatIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{t.title}</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {t.category}
                  </span>
                </div>
              </div>
              <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{t.description}</p>
              <button
                type="button"
                onClick={() => handleGenerate(t.type)}
                disabled={isGenerating}
                className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                  isGenerating
                    ? 'bg-slate-50 text-slate-300 border border-slate-100'
                    : 'bg-slate-900 hover:bg-black text-white shadow-sm'
                }`}
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                {isGenerating ? 'Generating…' : 'Generate Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Recent runs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Runs</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Last 50 — newest first
            </p>
          </div>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">
            No reports generated yet. Pick a template above and click Generate Now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3">Report</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Completed</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.map(j => {
                  const tone = STATUS_TONE[j.status] ?? STATUS_TONE.PENDING;
                  const tpl = TEMPLATES.find(t => t.type === j.type);
                  return (
                    <tr key={j.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <div className="text-[13px] font-bold text-slate-900">{tpl?.title ?? j.type}</div>
                        {j.fileName && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{j.fileName}</div>
                        )}
                        {j.status === 'FAILED' && j.error && (
                          <div className="text-[11px] text-rose-600 mt-0.5">{j.error}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${tone.text} ${tone.bg}`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3 text-[12px] text-slate-600">{fmtDateTime(j.createdAt)}</td>
                      <td className="py-3 text-[12px] text-slate-600">{fmtDateTime(j.completedAt)}</td>
                      <td className="py-3 text-right">
                        {j.status === 'COMPLETED' ? (
                          <a
                            href={`/api/reports/download/${j.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
