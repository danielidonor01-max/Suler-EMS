'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Download } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface LeaveRow {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
  employee: {
    id: string;
    staffId: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    branch: string | null;
  };
}

const QUEUE_STATES = 'SUBMITTED,MANAGER_APPROVED';

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export default function LeaveApprovalsPage() {
  const { data, error, isLoading, mutate } = useSWR<LeaveRow[]>(
    `/api/leave/requests?scope=team&status=${QUEUE_STATES}`,
    apiFetcher,
    { refreshInterval: 15_000 }
  );

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);

  const queue = useMemo(() => {
    return (data ?? []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data]);

  const pendingManager = queue.filter(r => r.status === 'SUBMITTED').length;
  const pendingHR = queue.filter(r => r.status === 'MANAGER_APPROVED').length;

  async function transition(row: LeaveRow, action: string, comment?: string) {
    setBusyId(row.id);
    setBannerError(null);
    try {
      await apiMutate(`/api/leave/requests/${row.id}/transition`, 'PATCH', { action, comment });
      await mutate();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  }

  function approveAction(row: LeaveRow): string {
    return row.status === 'SUBMITTED' ? 'APPROVE_MANAGER' : 'APPROVE_HR';
  }
  function rejectAction(row: LeaveRow): string {
    return row.status === 'SUBMITTED' ? 'REJECT_MANAGER' : 'REJECT_HR';
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals</h1>
            <p className="text-slate-500 text-[14px] mt-2">Pending leave requests for your review. Approves are atomic and audited.</p>
          </div>
          <a
            href="/api/leave/report"
            aria-label="Download leave report CSV (last 12 months)"
            className="h-[40px] px-4 rounded-[12px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Report CSV
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Awaiting Manager</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingManager}</p>
          </div>
          <div className="p-5 bg-sky-50 border border-sky-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Awaiting HR</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingHR}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Queue Total</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{queue.length}</p>
          </div>
        </div>

        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{bannerError}</div>
        )}

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Window</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Days</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stage</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (<tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-slate-500">Loading queue…</td></tr>)}
              {error && (<tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-rose-700">Could not load queue: {error.message}</td></tr>)}
              {!isLoading && !error && queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-slate-500">
                    <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                    All clear — no pending requests in your queue.
                  </td>
                </tr>
              )}
              {queue.map(row => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-bold text-slate-900">{row.employee.firstName} {row.employee.lastName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{row.employee.staffId} · {row.employee.jobTitle}</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{row.type}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">
                      {new Date(row.startDate).toLocaleDateString()} → {new Date(row.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{daysBetween(row.startDate, row.endDate)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700">
                        <Clock className="w-3 h-3" />
                        {row.status === 'SUBMITTED' ? 'Manager' : 'HR'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={busyId === row.id}
                          onClick={() => transition(row, approveAction(row))}
                          className="h-[34px] px-3 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          disabled={busyId === row.id}
                          onClick={() => { setRejectingId(row.id); setRejectReason(''); }}
                          className="h-[34px] px-3 rounded-[10px] bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                  {row.reason && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={6} className="px-6 py-3 text-[12px] text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Reason</span>
                        {row.reason}
                      </td>
                    </tr>
                  )}
                  {rejectingId === row.id && (
                    <tr className="bg-rose-50/40">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <textarea
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            rows={2} minLength={5}
                            aria-label="Reason for rejection"
                            placeholder="Reason for rejection (min 5 chars)"
                            className="flex-1 px-4 py-3 rounded-[12px] border border-rose-200 text-[13px] bg-white focus:outline-none focus:border-rose-400 resize-none"
                          />
                          <button
                            disabled={rejectReason.trim().length < 5 || busyId === row.id}
                            onClick={() => transition(row, rejectAction(row), rejectReason)}
                            className="h-[44px] px-5 rounded-[12px] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="h-[44px] px-4 rounded-[12px] text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
