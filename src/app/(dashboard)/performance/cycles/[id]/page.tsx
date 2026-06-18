"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Clock, FileText, Calendar, AlertTriangle,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
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

function CycleDetailInner() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const { data: cycle, isLoading } = useApi<CycleDetail>(
    id ? `/api/performance/cycles/${id}` : null,
    { pollMs: 30_000 },
  );

  if (isLoading || !cycle) {
    return <div className="p-8 text-[13px] text-slate-500">Loading cycle…</div>;
  }

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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <EmployeeChip
                          employeeId={r.employee.id}
                          name={`${r.employee.firstName} ${r.employee.lastName}`}
                          sublabel={r.employee.jobTitle}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 text-[12px] text-slate-700">
                        {r.reviewer?.name ?? <span className="text-amber-600 font-bold">Unassigned</span>}
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
