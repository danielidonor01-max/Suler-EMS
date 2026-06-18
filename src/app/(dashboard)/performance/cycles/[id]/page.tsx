"use client";

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Clock, FileText, Calendar, AlertTriangle, Users,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { RouteGuard } from '@/components/common/RouteGuard';

interface CycleDetail {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  dueDate: string | null;
  status: string;
  description: string | null;
  reviews: Array<{
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED';
    overallRating: number | null;
    submittedAt: string | null;
    employeeAcknowledgedAt: string | null;
    employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string; branch: string | null };
    reviewer: { id: string; name: string; email: string } | null;
  }>;
}

const STATUS_TONE: Record<string, { text: string; bg: string }> = {
  PENDING:      { text: 'text-slate-600',  bg: 'bg-slate-100' },
  IN_PROGRESS:  { text: 'text-indigo-700', bg: 'bg-indigo-50' },
  SUBMITTED:    { text: 'text-amber-700',  bg: 'bg-amber-50' },
  ACKNOWLEDGED: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

export default function CycleDetailPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <CycleDetailInner />
    </RouteGuard>
  );
}

interface ReviewerOption {
  id: string;
  name: string;
  email: string;
  role: { name: string };
  employee: { jobTitle: string; branch: string | null } | null;
}

function CycleDetailInner() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const { data: cycle, isLoading, refresh } = useApi<CycleDetail>(
    id ? `/api/performance/cycles/${id}` : null,
    { pollMs: 30_000 },
  );
  const { data: reviewers = [] } = useApi<ReviewerOption[]>(
    '/api/performance/reviewers',
    { pollMs: false },
  );

  // Bulk-assign state: which rows the user has selected.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkReviewerId, setBulkReviewerId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const reviewerOptions = useMemo(
    () => reviewers.map(r => ({
      value: r.id,
      label: `${r.name}${r.employee?.jobTitle ? ` — ${r.employee.jobTitle}` : ` — ${r.role.name}`}`,
    })),
    [reviewers],
  );

  if (isLoading || !cycle) {
    return <div className="p-8 text-[13px] text-slate-500">Loading cycle…</div>;
  }

  const assignReviewer = async (reviewId: string, reviewerId: string) => {
    setUpdating(reviewId);
    try {
      await apiMutate(`/api/performance/reviews/${reviewId}`, 'PATCH', {
        reviewerId: reviewerId || null,
      });
      await refresh();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Could not update reviewer');
    } finally {
      setUpdating(null);
    }
  };

  const toggleRow = (reviewId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === cycle.reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cycle.reviews.map(r => r.id)));
    }
  };

  const bulkAssign = async () => {
    if (!bulkReviewerId || selectedIds.size === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await Promise.all(
        Array.from(selectedIds).map(reviewId =>
          apiMutate(`/api/performance/reviews/${reviewId}`, 'PATCH', { reviewerId: bulkReviewerId }),
        ),
      );
      setSelectedIds(new Set());
      setBulkReviewerId('');
      await refresh();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk assign failed');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-8">
      <Link
        href="/performance/cycles"
        className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to cycles
      </Link>

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
          {cycle.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{cycle.type}</span>
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(cycle.startDate))}
            {' – '}
            {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(cycle.endDate))}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100">
            {cycle.status}
          </span>
        </div>
        {cycle.description && (
          <p className="text-[13px] text-slate-500 leading-relaxed mt-3">{cycle.description}</p>
        )}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reviews ({cycle.reviews.length})</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            One row per employee in this cycle
          </p>
        </div>

        {cycle.reviews.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">
            No reviews assigned yet. Use the Assign button on the cycles list to create rows.
          </div>
        ) : (
          <>
            {/* Bulk-assign toolbar — only shows when at least one row is selected */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-[12px] font-bold text-indigo-900">
                  {selectedIds.size} selected
                </span>
                <select
                  value={bulkReviewerId}
                  onChange={(e) => setBulkReviewerId(e.target.value)}
                  aria-label="Bulk reviewer"
                  className="h-9 bg-white border border-indigo-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:border-indigo-500 flex-1 max-w-[300px]"
                >
                  <option value="">— Pick a reviewer —</option>
                  {reviewerOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={bulkAssign}
                  disabled={bulkBusy || !bulkReviewerId}
                  className="px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                >
                  {bulkBusy ? 'Assigning…' : 'Assign to Selected'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkBusy}
                  className="px-3 h-9 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                >
                  Clear
                </button>
              </div>
            )}
            {bulkError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-[12px] font-medium text-rose-700">{bulkError}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === cycle.reviews.length && cycle.reviews.length > 0}
                        onChange={toggleAll}
                        aria-label="Select all"
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3">Employee</th>
                    <th className="py-3">Reviewer</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Rating</th>
                    <th className="py-3">Submitted</th>
                    <th className="py-3">Acknowledged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cycle.reviews.map(r => {
                    const tone = STATUS_TONE[r.status] ?? STATUS_TONE.PENDING;
                    const isLocked = r.status === 'SUBMITTED' || r.status === 'ACKNOWLEDGED';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleRow(r.id)}
                            disabled={isLocked}
                            aria-label={`Select ${r.employee.firstName} ${r.employee.lastName}`}
                            className="w-4 h-4 cursor-pointer disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3">
                          <EmployeeChip
                            employeeId={r.employee.id}
                            name={`${r.employee.firstName} ${r.employee.lastName}`}
                            sublabel={r.employee.jobTitle}
                            size="sm"
                          />
                        </td>
                        <td className="py-3">
                          {isLocked ? (
                            <span className="text-[12px] text-slate-700 font-medium">
                              {r.reviewer?.name ?? <span className="text-slate-400 italic">none</span>}
                            </span>
                          ) : (
                            <select
                              value={r.reviewer?.id ?? ''}
                              onChange={(e) => assignReviewer(r.id, e.target.value)}
                              disabled={updating === r.id}
                              aria-label={`Reviewer for ${r.employee.firstName} ${r.employee.lastName}`}
                              className={`h-8 bg-white border rounded-lg px-2 text-[12px] font-medium outline-none focus:border-indigo-500 max-w-[220px] ${
                                r.reviewer ? 'border-slate-200' : 'border-amber-300 bg-amber-50'
                              }`}
                            >
                              <option value="">— Unassigned —</option>
                              {reviewerOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${tone.text} ${tone.bg}`}>
                            {r.status === 'ACKNOWLEDGED' && <CheckCircle2 className="w-3 h-3" />}
                            {r.status === 'SUBMITTED' && <FileText className="w-3 h-3" />}
                            {(r.status === 'PENDING' || r.status === 'IN_PROGRESS') && <Clock className="w-3 h-3" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 text-[13px] font-bold text-slate-900">
                          {r.overallRating ? `${r.overallRating} / 5` : '—'}
                        </td>
                        <td className="py-3 text-[12px] text-slate-500">
                          {r.submittedAt ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(r.submittedAt)) : '—'}
                        </td>
                        <td className="py-3 text-[12px] text-slate-500">
                          {r.employeeAcknowledgedAt ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(r.employeeAcknowledgedAt)) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <span className="text-[12px] text-slate-600">
          Reviewer fills the review from <strong>Performance &rarr; Reviews to Conduct</strong>. Employee acknowledges from <strong>Performance &rarr; My Reviews</strong> once submitted.
        </span>
      </div>
    </div>
  );
}
