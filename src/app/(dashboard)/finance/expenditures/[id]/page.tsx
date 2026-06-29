"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Activity, CheckCircle2, XCircle, Send, Banknote,
  AlertTriangle, History, Briefcase, Layers,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { EmployeeChip } from '@/components/employees/EmployeeChip';

interface Expenditure {
  id:           string;
  description:  string;
  amount:       string | number;
  status:       'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DISBURSED' | 'REJECTED' | 'CANCELLED';
  vendor:       string | null;
  category:     { id: string; name: string; code: string } | null;
  budget:       { id: string; name: string; currency: string; totalAmount: string | number; spentAmount: string | number };
  requestedBy:  { id: string; staffId: string; firstName: string; lastName: string; email: string; jobTitle: string };
  approvedById: string | null;
  disbursedById: string | null;
  rejectReason: string | null;
  paymentMethod: string | null;
  paymentDate:  string | null;
  createdAt:    string;
  updatedAt:    string;
  history:      Array<{
    id:         string;
    actorName:  string;
    actorRole:  string;
    fromState:  string;
    toState:    string;
    action:     string;
    comment:    string | null;
    timestamp:  string;
  }>;
}

function num(v: string | number): number {
  return typeof v === 'number' ? v : Number(v);
}
function fmtNGN(v: string | number): string {
  return `₦${num(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  DRAFT:      { bg: 'bg-slate-100',   border: 'border-slate-200',   text: 'text-slate-700',   label: 'Draft' },
  SUBMITTED:  { bg: 'bg-amber-50',    border: 'border-amber-100',   text: 'text-amber-700',   label: 'Awaiting approval' },
  APPROVED:   { bg: 'bg-emerald-50',  border: 'border-emerald-100', text: 'text-emerald-700', label: 'Approved' },
  DISBURSED:  { bg: 'bg-indigo-50',   border: 'border-indigo-100',  text: 'text-indigo-700',  label: 'Disbursed' },
  REJECTED:   { bg: 'bg-rose-50',     border: 'border-rose-100',    text: 'text-rose-700',    label: 'Rejected' },
  CANCELLED:  { bg: 'bg-slate-100',   border: 'border-slate-200',   text: 'text-slate-500',   label: 'Cancelled' },
};

const EVENT_TONE: Record<string, { tone: string; icon: React.ComponentType<{ className?: string }> }> = {
  CREATE:           { tone: 'text-slate-500',   icon: Activity },
  SUBMIT:           { tone: 'text-amber-700',   icon: Send },
  APPROVE_FINANCE:  { tone: 'text-emerald-700', icon: CheckCircle2 },
  REJECT_FINANCE:   { tone: 'text-rose-700',    icon: XCircle },
  DISBURSE:         { tone: 'text-indigo-700',  icon: Banknote },
  CANCEL:           { tone: 'text-slate-500',   icon: XCircle },
};

export default function ExpenditureDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data, isLoading, error } = useApi<Expenditure>(
    id ? `/api/finance/expenditures/${id}?includeHistory=true` : null,
  );

  if (isLoading) return <div className="p-12 text-center text-[12px] text-slate-500">Loading expenditure…</div>;
  if (error) return (
    <div className="p-12 text-center text-[13px] text-rose-700">
      Couldn&apos;t load this expenditure. {error.message ?? ''}
    </div>
  );
  if (!data) return null;

  const tone = STATUS_STYLE[data.status] ?? STATUS_STYLE.DRAFT;
  const remaining = num(data.budget.totalAmount) - num(data.budget.spentAmount);

  return (
    <div className="section-breathing max-w-[1100px] mx-auto animate-in space-y-8">

      <Link
        href="/finance"
        className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Finance
      </Link>

      <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.2em] border ${tone.bg} ${tone.border} ${tone.text}`}>
                {tone.label}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Filed {fmtDateTime(data.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {data.description}
            </h1>
            {data.vendor && (
              <p className="text-[12px] text-slate-500 mt-1">Vendor: {data.vendor}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</div>
            <div className="text-3xl font-black text-slate-900 leading-none mt-1">{fmtNGN(data.amount)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <KV label="Budget" value={data.budget.name} sublabel={`Remaining ${fmtNGN(remaining)}`} />
          <KV label="Category" value={data.category?.name ?? '—'} sublabel={data.category?.code ?? null} />
          <KV label="Requester" value={`${data.requestedBy.firstName} ${data.requestedBy.lastName}`} sublabel={data.requestedBy.jobTitle} />
          <KV label="Payment" value={data.paymentMethod ?? '—'} sublabel={data.paymentDate ? fmtDateTime(data.paymentDate) : null} />
        </div>
      </div>

      {data.status === 'REJECTED' && data.rejectReason && (
        <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Rejection reason</div>
            <div className="text-[13px] text-rose-700 mt-1 leading-relaxed">{data.rejectReason}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Requester</h2>
        </div>
        <EmployeeChip
          employeeId={data.requestedBy.id}
          name={`${data.requestedBy.firstName} ${data.requestedBy.lastName}`}
          sublabel={`${data.requestedBy.staffId} · ${data.requestedBy.jobTitle}`}
          size="md"
        />
      </div>

      <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Audit Trail</h2>
          <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {data.history.length} event{data.history.length === 1 ? '' : 's'}
          </span>
        </div>
        {data.history.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-slate-400">No audit events recorded yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.history.map(h => {
              const meta = EVENT_TONE[h.action] ?? EVENT_TONE.CREATE;
              const Icon = meta.icon;
              return (
                <li key={h.id} className="p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${meta.tone}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${meta.tone}`}>
                        {h.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {fmtDateTime(h.timestamp)}
                      </div>
                    </div>
                    <div className="text-[12px] font-bold text-slate-900 mt-1">
                      {h.fromState} → {h.toState}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {h.actorName} · {h.actorRole}
                    </div>
                    {h.comment && (
                      <div className="mt-2 text-[12px] text-slate-700 italic bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        &ldquo;{h.comment}&rdquo;
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function KV({ label, value, sublabel }: { label: string; value: string; sublabel?: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <Layers className="w-3 h-3" />
        {label}
      </div>
      <div className="text-[13px] font-bold text-slate-900 mt-1">{value}</div>
      {sublabel && <div className="text-[10px] text-slate-500 mt-0.5">{sublabel}</div>}
    </div>
  );
}
