'use client';

import React, { useState } from 'react';
import { Activity, Plus, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { apiFetcher } from '@/lib/api/fetcher';
import { LeaveSubmitModal } from '@/components/leave/LeaveSubmitModal';

interface LeaveRequestRow {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
  employee: { firstName: string; lastName: string };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:            'bg-slate-100 text-slate-600',
  SUBMITTED:        'bg-amber-50 text-amber-700',
  MANAGER_APPROVED: 'bg-sky-50 text-sky-700',
  APPROVED:         'bg-emerald-50 text-emerald-700',
  REJECTED:         'bg-rose-50 text-rose-700',
  CANCELLED:        'bg-slate-100 text-slate-500',
};

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export default function MyLeavePage() {
  const { data, error, isLoading, mutate } = useSWR<LeaveRequestRow[]>(
    '/api/leave/requests?scope=mine',
    apiFetcher,
    { refreshInterval: 30_000 }
  );
  const [showModal, setShowModal] = useState(false);

  const requests = data ?? [];
  const pendingCount = requests.filter(r => ['SUBMITTED', 'MANAGER_APPROVED'].includes(r.status)).length;
  const approvedThisYear = requests.filter(r => r.status === 'APPROVED' && new Date(r.startDate).getFullYear() === new Date().getFullYear()).length;

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Leave Requests</h1>
            <p className="text-slate-500 text-[14px] mt-2">Manage your time off, view balances, and submit new requests.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-black text-white px-5 h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-widest shadow-premium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2px]" />
            New Request
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Approved (YTD)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{approvedThisYear}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Requests</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{requests.length}</p>
          </div>
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending Approval</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 border border-slate-200 rounded-[24px] text-center text-[13px] text-slate-500">Loading your requests…</div>
        ) : error ? (
          <div className="p-12 border border-rose-200 bg-rose-50 rounded-[24px] text-center text-[13px] text-rose-700">
            Could not load requests: {error.message}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center mt-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Recent Requests</h3>
            <p className="text-[13px] text-slate-500 max-w-[300px] mt-1">You haven't submitted any leave requests yet. Click "New Request" to apply for time off.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dates</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Days</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{r.type}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-700">{daysBetween(r.startDate, r.endDate)}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600 max-w-[260px] truncate">{r.reason ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeaveSubmitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmitted={() => mutate()}
      />
    </div>
  );
}
