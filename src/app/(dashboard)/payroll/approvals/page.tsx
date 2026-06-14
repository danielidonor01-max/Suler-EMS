'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Banknote, Eye } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface RunRow {
  id: string;
  name: string;
  period: string;
  status: string;
  totalGross: string | number;
  totalNet: string | number;
  totalDeductions: string | number;
  entryCount: number;
  department?: { id: string; name: string; code: string } | null;
}

const QUEUE_STATES = ['REVIEW', 'APPROVED'];

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function fmt(v: string | number) {
  return `₦${num(v).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function PayrollApprovalsPage() {
  const { data, error, isLoading, mutate } = useSWR<RunRow[]>('/api/payroll/runs', apiFetcher, {
    refreshInterval: 15_000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const queue = useMemo(() => {
    return (data ?? []).filter(r => QUEUE_STATES.includes(r.status))
                       .sort((a, b) => a.period.localeCompare(b.period));
  }, [data]);

  const pendingReview = queue.filter(r => r.status === 'REVIEW').length;
  const pendingProcess = queue.filter(r => r.status === 'APPROVED').length;
  const committedNet = queue.filter(r => r.status === 'APPROVED').reduce((s, r) => s + num(r.totalNet), 0);

  async function transition(row: RunRow, action: 'APPROVE' | 'REJECT' | 'PROCESS') {
    setBusyId(row.id);
    setBannerError(null);
    try {
      await apiMutate(`/api/payroll/runs/${row.id}/transition`, 'PATCH', { action });
      await mutate();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Approvals</h1>
          <p className="text-slate-500 text-[14px] mt-2">Review, approve, and process payroll runs. Processing is irreversible and auto-applies pending adjustments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Awaiting Review</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingReview}</p>
          </div>
          <div className="p-5 bg-sky-50 border border-sky-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Approved — Pending Process</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingProcess}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Committed Net</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{fmt(committedNet)}</p>
          </div>
        </div>

        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{bannerError}</div>
        )}

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Period</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Run</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Entries</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gross</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Net</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stage</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (<tr><td colSpan={7} className="px-6 py-12 text-center text-[13px] text-slate-500">Loading queue…</td></tr>)}
              {error && (<tr><td colSpan={7} className="px-6 py-12 text-center text-[13px] text-rose-700">Could not load queue: {error.message}</td></tr>)}
              {!isLoading && !error && queue.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[13px] text-slate-500">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  No payroll runs in your queue.
                </td></tr>
              )}
              {queue.map(row => {
                const inReview = row.status === 'REVIEW';
                const inApproved = row.status === 'APPROVED';
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{row.period}</td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-slate-900">{row.name}</div>
                      {row.department && <div className="text-[11px] text-slate-500 mt-0.5">{row.department.name}</div>}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{row.entryCount}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{fmt(row.totalGross)}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{fmt(row.totalNet)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${inApproved ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                        <Clock className="w-3 h-3" />
                        {inApproved ? 'Process' : 'Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/payroll/runs/${row.id}`}
                          className="h-[34px] px-3 rounded-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                        {inReview && (
                          <>
                            <button disabled={busyId === row.id} onClick={() => transition(row, 'APPROVE')}
                              className="h-[34px] px-3 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button disabled={busyId === row.id} onClick={() => transition(row, 'REJECT')}
                              className="h-[34px] px-3 rounded-[10px] bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {inApproved && (
                          <button disabled={busyId === row.id} onClick={() => transition(row, 'PROCESS')}
                            className="h-[34px] px-3 rounded-[10px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                            <Banknote className="w-3.5 h-3.5" />
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
