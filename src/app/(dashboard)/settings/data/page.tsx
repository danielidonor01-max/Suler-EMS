"use client";

import React, { useState } from 'react';
import {
  Database, HardDrive, Download, Trash2, RefreshCw, Clock, Archive,
  AlertTriangle, ShieldCheck, FileJson, FileText, CheckCircle2,
} from 'lucide-react';
import { RouteGuard } from '@/components/common/RouteGuard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useWorkforce } from '@/context/WorkforceContext';
import { usePayroll } from '@/context/PayrollContext';
import { useFinance } from '@/context/FinanceContext';

interface Backup {
  id: string;
  sizeBytes: number;
  rowCount: number;
  tablesIncluded: string[];
  schemaVersion: string;
  description: string | null;
  status: 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function DataManagementPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <DataManagementInner />
    </RouteGuard>
  );
}

function DataManagementInner() {
  const { data: backups = [], refresh } = useApi<Backup[]>('/api/backups', { pollMs: 30_000 });

  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const { employees } = useWorkforce();
  const { payrollRuns } = usePayroll();
  const { expenditures } = useFinance();

  const totalSize = backups.reduce((sum, b) => sum + b.sizeBytes, 0);
  const lastBackup = backups[0];
  const completedCount = backups.filter(b => b.status === 'COMPLETED').length;

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setFlash(null);
    try {
      await apiMutate('/api/backups', 'POST', { description: description || null });
      await refresh();
      setFlash('Backup created. Download it from the table below.');
      setDescription('');
      setShowDescriptionInput(false);
    } catch (err: any) {
      setError(err?.message ?? 'Backup failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this backup? Download it first if you want a copy.')) return;
    try {
      await apiMutate(`/api/backups/${id}`, 'DELETE');
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed');
    }
  };

  // CSV exports — client-side, served from React context state. Kept
  // here because the backups system is a structural snapshot, not a
  // per-module export. These remain useful for analysts who want a
  // single module as a spreadsheet.
  const exportCsv = (rows: any[], filename: string) => {
    if (!rows.length) { alert('Nothing to export.'); return; }
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      if (v == null) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '﻿' + [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape((r as any)[h])).join(',')),
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-10">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                Data Governance
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Data Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[560px]">
              Create on-demand backups (gzipped JSON manifests of every structural and transactional table) for off-site
              archival. Restore is a Supabase-PITR operation — download backups and store them safely.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDescriptionInput(v => !v)}
            disabled={creating}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-70 shrink-0"
          >
            {creating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Creating…</>
            ) : (
              <><HardDrive className="w-4 h-4" />New Backup</>
            )}
          </button>
        </div>
      </div>

      {/* Description input + create button (revealed by hero button) */}
      {showDescriptionInput && (
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-3 animate-in">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pre-payroll-cutover snapshot"
              aria-label="Description"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowDescriptionInput(false); setDescription(''); }}
              disabled={creating}
              className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create Backup'}
            </button>
          </div>
        </div>
      )}

      {flash && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-emerald-700">{flash}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{error}</span>
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Backups Stored" value={`${backups.length}`} variant="tonal-info"    icon={Archive} />
        <MetricCard label="Completed"      value={`${completedCount}`} variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Total Size"     value={fmtSize(totalSize)}  variant="tonal-info"    icon={Database} />
        <MetricCard
          label="Last Backup"
          value={lastBackup ? fmtDateTime(lastBackup.createdAt) : 'Never'}
          variant={lastBackup ? 'tonal-success' : 'tonal-warning'}
          icon={Clock}
        />
      </div>

      {/* ── Backup table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Backup History</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Last 50 — newest first
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">
            No backups yet. Click <strong>New Backup</strong> above to create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3">Created</th>
                  <th className="py-3">Description</th>
                  <th className="py-3">Tables</th>
                  <th className="py-3">Rows</th>
                  <th className="py-3">Size</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {backups.map(b => {
                  const isCompleted = b.status === 'COMPLETED';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <div className="text-[12px] font-bold text-slate-900">{fmtDateTime(b.createdAt)}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">by {b.createdBy.name}</div>
                      </td>
                      <td className="py-3 text-[12px] text-slate-700 max-w-[200px] truncate">
                        {b.description ?? <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3 text-[12px] text-slate-700">{b.tablesIncluded.length}</td>
                      <td className="py-3 text-[12px] text-slate-700">{b.rowCount.toLocaleString()}</td>
                      <td className="py-3 text-[12px] text-slate-700">{fmtSize(b.sizeBytes)}</td>
                      <td className="py-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span title={b.error ?? undefined} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isCompleted && (
                            <a
                              href={`/api/backups/${b.id}/download`}
                              aria-label={`Download backup ${b.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            aria-label="Delete backup"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Module exports ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Module Exports</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Single-module CSV downloads for spreadsheets
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExportTile
            icon={FileText}
            title="Workforce"
            description="All employees and their attached fields, one row each."
            count={employees.length}
            onClick={() => exportCsv(employees, `suler-workforce-${today}.csv`)}
          />
          <ExportTile
            icon={FileText}
            title="Payroll Entries"
            description="Every payslip line across all runs."
            count={payrollRuns.flatMap(r => r.entries ?? []).length}
            onClick={() => exportCsv(payrollRuns.flatMap(r => r.entries ?? []), `suler-payroll-${today}.csv`)}
          />
          <ExportTile
            icon={FileJson}
            title="Expenditures"
            description="Submitted, approved, and paid expenditures."
            count={expenditures.length}
            onClick={() => exportCsv(expenditures, `suler-finance-${today}.csv`)}
          />
        </div>
      </div>
    </div>
  );
}

function ExportTile({
  icon: Icon, title, description, count, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[20px] p-5 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-slate-900">{title}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {count.toLocaleString()} rows
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
    </button>
  );
}
