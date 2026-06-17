"use client";

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  FileText, ArrowRightLeft,
} from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { Modal } from '@/components/common/Modal';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useEmployeeProfile } from '@/context/EmployeeProfileContext';
import { EmployeeChip } from '@/components/employees/EmployeeChip';

interface ChangeRequest {
  id: string;
  field: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string; branch: string | null };
  requestedBy: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string; email: string } | null;
}

const FIELD_LABEL: Record<string, string> = {
  firstName: 'First Name',
  lastName:  'Last Name',
  phone:     'Phone',
  jobTitle:  'Job Title',
  grade:     'Grade',
  branch:    'Branch / Hub',
  nin:       'NIN',
  bvn:       'BVN',
  tin:       'TIN',
  pensionPFA: 'Pension PFA',
  pensionNumber: 'Pension Number',
  nhfNumber: 'NHF Number',
};

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  PENDING:   { text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-100' },
  APPROVED:  { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  REJECTED:  { text: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-100' },
  CANCELLED: { text: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function ProfileRequestsPage() {
  const { data: requests = [], refresh } = useApi<ChangeRequest[]>(
    '/api/profile/change-requests?scope=all',
    { pollMs: 30_000 },
  );
  const { openProfile } = useEmployeeProfile();

  const [reviewing, setReviewing] = useState<{ request: ChangeRequest; action: 'APPROVE' | 'REJECT' } | null>(null);

  const stats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0;
    for (const r of requests) {
      if (r.status === 'PENDING') pending++;
      else if (r.status === 'APPROVED') approved++;
      else if (r.status === 'REJECTED') rejected++;
    }
    return { pending, approved, rejected };
  }, [requests]);

  // Cast to satisfy DataTable's row typing (it works on any).
  const rows = requests as unknown as any[];

  const columns = [
    {
      header: 'Employee', accessor: 'employee',
      render: (_val: unknown, row: ChangeRequest) => (
        <EmployeeChip
          employeeId={row.employee.id}
          name={`${row.employee.firstName} ${row.employee.lastName}`}
          sublabel={row.employee.staffId}
          size="md"
        />
      ),
    },
    {
      header: 'Field', accessor: 'field',
      render: (val: string) => (
        <span className="text-[12px] font-bold text-slate-700">{FIELD_LABEL[val] ?? val}</span>
      ),
    },
    {
      header: 'Change', accessor: 'proposedValue',
      render: (_val: unknown, row: ChangeRequest) => (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 line-through truncate max-w-[120px]">
            {row.currentValue ?? '—'}
          </span>
          <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[12px] font-bold text-slate-900 truncate max-w-[120px]">
            {row.proposedValue ?? '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Reason', accessor: 'reason',
      render: (val: string) => (
        <span className="text-[11px] text-slate-600 italic line-clamp-2">{val}</span>
      ),
    },
    {
      header: 'Status', accessor: 'status',
      render: (val: string) => {
        const tone = STATUS_TONE[val] ?? STATUS_TONE.PENDING;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${tone.text} ${tone.bg} border ${tone.border}`}>
            {val}
          </span>
        );
      },
    },
    {
      header: 'Created', accessor: 'createdAt',
      render: (val: string) => (
        <span className="text-[11px] text-slate-500">{fmtDateTime(val)}</span>
      ),
    },
  ];

  const rowActions = [
    {
      label: 'View Profile',
      icon: FileText,
      onClick: (row: ChangeRequest) => openProfile(row.employee.id),
    },
    {
      label: 'Approve',
      icon: CheckCircle2,
      onClick: (row: ChangeRequest) => setReviewing({ request: row, action: 'APPROVE' }),
      hidden: (row: ChangeRequest) => row.status !== 'PENDING',
    },
    {
      label: 'Reject',
      icon: XCircle,
      variant: 'danger' as const,
      onClick: (row: ChangeRequest) => setReviewing({ request: row, action: 'REJECT' }),
      hidden: (row: ChangeRequest) => row.status !== 'PENDING',
    },
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            HR Review Queue
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
          Profile Change Requests
        </h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[560px]">
          Employees requesting changes to their identity, employment, or compliance fields.
          Approving auto-applies the value to their profile and notifies them; rejecting requires a reason.
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Pending" value={`${stats.pending}`} variant="tonal-warning" icon={Clock} />
        <MetricCard label="Approved" value={`${stats.approved}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Rejected" value={`${stats.rejected}`} variant="tonal-info" icon={XCircle} />
        <MetricCard label="Total" value={`${requests.length}`} variant="tonal-info" icon={FileText} />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <DataTable
        title="Active Requests"
        description="Pending requests appear first. Use the kebab menu to approve / reject."
        data={rows}
        columns={columns as any}
        rowActions={rowActions}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(v => ({ label: v, value: v })),
          },
        ]}
      />

      <ReviewModal
        target={reviewing}
        onClose={() => setReviewing(null)}
        onReviewed={() => { setReviewing(null); refresh(); }}
      />
    </div>
  );
}

// ─── Review modal ────────────────────────────────────────────────────────────

function ReviewModal({
  target, onClose, onReviewed,
}: {
  target: { request: ChangeRequest; action: 'APPROVE' | 'REJECT' } | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => { if (target) { setComment(''); setError(null); } }, [target]);

  if (!target) return null;
  const { request, action } = target;
  const isApprove = action === 'APPROVE';

  const handleSubmit = async () => {
    if (!isApprove && !comment.trim()) {
      setError('A reason is required when rejecting');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/profile/change-requests/${request.id}`, 'PATCH', {
        action: isApprove ? 'APPROVE' : 'REJECT',
        reviewComment: comment.trim() || null,
      });
      onReviewed();
    } catch (err: any) {
      setError(err?.message ?? 'Review failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title={isApprove ? 'Approve Change' : 'Reject Change'}
      size="md"
    >
      <div className="space-y-5">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</div>
            <div className="text-[13px] font-bold text-slate-900">
              {request.employee.firstName} {request.employee.lastName} ({request.employee.staffId})
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field</div>
            <div className="text-[13px] font-bold text-slate-900">{FIELD_LABEL[request.field] ?? request.field}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</div>
              <div className="text-[13px] font-medium text-slate-700 line-through">{request.currentValue ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed</div>
              <div className="text-[13px] font-bold text-slate-900">{request.proposedValue ?? '—'}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason from requester</div>
            <div className="text-[12px] text-slate-700 italic">&ldquo;{request.reason}&rdquo;</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isApprove ? 'Review comment (optional)' : 'Reason for rejection (required)'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            aria-label="Review comment"
            placeholder={isApprove ? 'Anything noteworthy for the audit log…' : 'Explain why this is being rejected — visible to the requester.'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-400"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        {isApprove && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-amber-700">
              Approving will immediately apply <strong>{request.proposedValue ?? '(empty)'}</strong> to the employee&apos;s {FIELD_LABEL[request.field] ?? request.field} field. This cannot be undone without a new request.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className={`flex-1 h-11 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60 ${
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {busy ? 'Working…' : isApprove ? 'Approve & Apply' : 'Reject Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
