'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { CheckCircle2, XCircle, Wallet, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface ExpenditureRow {
  id: string;
  description: string;
  amount: string | number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CANCELLED';
  vendor?: string | null;
  reference?: string | null;
  createdAt: string;
  budget: { id: string; name: string; currency?: string };
  category?: { id: string; name: string; code: string | null } | null;
  requestedBy: { id: string; staffId: string; firstName: string; lastName: string; jobTitle?: string };
}

const QUEUE_STATES = 'SUBMITTED,APPROVED';

function fmtNGN(v: string | number) {
  const n = typeof v === 'number' ? v : Number(v);
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default function FinanceApprovalsPage() {
  const { data, error, isLoading, mutate } = useSWR<ExpenditureRow[]>(
    `/api/finance/expenditures?scope=team&status=${QUEUE_STATES}`,
    apiFetcher,
    { refreshInterval: 15_000 },
  );

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);

  const queue = useMemo(() => {
    return (data ?? []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data]);

  const pendingApproval = queue.filter(r => r.status === 'SUBMITTED').length;
  const pendingDisbursement = queue.filter(r => r.status === 'APPROVED').length;
  const totalCommitted = queue
    .filter(r => r.status === 'APPROVED')
    .reduce((s, r) => s + Number(r.amount), 0);

  async function transition(row: ExpenditureRow, action: 'APPROVE_FINANCE' | 'REJECT_FINANCE' | 'DISBURSE', comment?: string) {
    setBusyId(row.id);
    setBannerError(null);
    try {
      await apiMutate(`/api/finance/expenditures/${row.id}/transition`, 'PATCH', { action, comment });
      await mutate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setBannerError(msg);
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Approvals</h1>
          <p className="text-slate-500 text-[14px] mt-2">Approve and disburse expenditures. All actions are atomic and audited. Disbursement is irreversible.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Awaiting Approval</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingApproval}</p>
          </div>
          <div className="p-5 bg-sky-50 border border-sky-100 rounded-[20px]">
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Awaiting Disbursement</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{pendingDisbursement}</p>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-[20px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Committed (Approved)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{fmtNGN(totalCommitted)}</p>
          </div>
        </div>

        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{bannerError}</div>
        )}

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Requester</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Budget / Category</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
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
                    All clear — no pending expenditures.
                  </td>
                </tr>
              )}
              {queue.map(row => {
                const isApprove = row.status === 'SUBMITTED';
                const isDisburse = row.status === 'APPROVED';
                return (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="text-[13px] font-bold text-slate-900">{row.requestedBy.firstName} {row.requestedBy.lastName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.requestedBy.staffId}{row.requestedBy.jobTitle ? ` · ${row.requestedBy.jobTitle}` : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] font-medium text-slate-900 max-w-[260px] truncate">{row.description}</div>
                        {row.vendor && <div className="text-[11px] text-slate-500 mt-0.5">{row.vendor}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-slate-700">{row.budget.name}</div>
                        {row.category && <div className="text-[11px] text-slate-500 mt-0.5">{row.category.name}</div>}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{fmtNGN(row.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isDisburse ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                          <Clock className="w-3 h-3" />
                          {isDisburse ? 'Disburse' : 'Approve'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isApprove && (
                            <>
                              <button
                                disabled={busyId === row.id}
                                onClick={() => transition(row, 'APPROVE_FINANCE')}
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
                            </>
                          )}
                          {isDisburse && (
                            <button
                              disabled={busyId === row.id}
                              onClick={() => transition(row, 'DISBURSE')}
                              className="h-[34px] px-3 rounded-[10px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
                              onClick={() => transition(row, 'REJECT_FINANCE', rejectReason)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
