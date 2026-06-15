'use client';

import React from 'react';
import useSWR from 'swr';
import { apiFetcher } from '@/lib/api/fetcher';

interface LeaveRequestRow {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  DRAFT:            { label: 'Draft',              tone: 'bg-slate-100 text-slate-600' },
  SUBMITTED:        { label: 'Pending Manager',    tone: 'bg-amber-50 text-amber-700' },
  MANAGER_APPROVED: { label: 'Pending HR',         tone: 'bg-sky-50 text-sky-700' },
  APPROVED:         { label: 'Approved',           tone: 'bg-emerald-50 text-emerald-700' },
  REJECTED:         { label: 'Rejected',           tone: 'bg-rose-50 text-rose-700' },
  CANCELLED:        { label: 'Cancelled',          tone: 'bg-slate-100 text-slate-500' },
};

const STAGE_LABELS: Record<string, string> = {
  DRAFT:            'Draft',
  SUBMITTED:        'Manager Review',
  MANAGER_APPROVED: 'HR Review',
  APPROVED:         'Completed',
  REJECTED:         'Closed — Rejected',
  CANCELLED:        'Closed — Cancelled',
};

export default function RequestTrackerPage() {
  const { data, error, isLoading } = useSWR<LeaveRequestRow[]>(
    '/api/leave/requests?scope=mine',
    apiFetcher,
    { refreshInterval: 30_000 }
  );

  const requests = data ?? [];

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Tracker</h1>
          <p className="text-slate-500 text-[14px] mt-2">Track the status of all your personal requests across the platform.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Request Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Submitted</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Window</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Current Stage</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-[13px] text-slate-500">Loading…</td></tr>
                )}
                {error && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-[13px] text-rose-700">Could not load requests: {error.message}</td></tr>
                )}
                {!isLoading && !error && requests.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-[13px] text-slate-500">No requests yet. Submit one from the Leave page.</td></tr>
                )}
                {requests.map(r => {
                  const status = STATUS_LABELS[r.status] ?? { label: r.status, tone: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{r.type} Leave</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">
                        {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700">{STAGE_LABELS[r.status] ?? r.status}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
