'use client';

/**
 * Centred modal that shows a leave request's full detail + audit
 * timeline + a "Ping for Approval" affordance for whoever is still
 * blocking the next step.
 *
 * Used by:
 *   - /leave/admin Approval Pipeline (replaces the old side drawer)
 *   - /tracker Request Tracker (the new Action column's View button)
 *
 * The modal fetches /api/leave/requests/[id]/timeline on open so the
 * timeline reflects the latest state every time (no parent prefetch).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, History, User, Calendar, AlertTriangle,
  CheckCircle2, XCircle, Clock, Bell, MessageSquare,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { WorkflowStatusBadge } from '../workflow/WorkflowUI';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

interface HistoryEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  fromState: string;
  toState: string;
  action: string;
  comment: string | null;
}

interface TimelinePayload {
  request: {
    id: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
    employee: { id: string; firstName: string; lastName: string; jobTitle: string };
  };
  history: HistoryEntry[];
  nextRole: string | null;
  nextApprovers: Array<{ id: string; name: string; role: string }>;
}

interface Props {
  leaveRequestId: string | null;
  onClose: () => void;
  /**
   * Optional. When provided, surfaces inline action buttons (Approve /
   * Reject / Withdraw) at the bottom of the modal — used from the
   * Approval Pipeline. Tracker callers pass undefined to hide them.
   */
  onAction?: (action: string, comment?: string) => Promise<void> | void;
  actionBusy?: boolean;
  actionError?: string | null;
}

const ACTIONS_FOR_STATE: Record<string, Array<{ action: string; label: string; variant: 'approve' | 'reject' | 'neutral'; needsComment?: boolean }>> = {
  DRAFT:            [{ action: 'CANCEL', label: 'Withdraw', variant: 'neutral' }],
  SUBMITTED:        [
    { action: 'APPROVE_MANAGER', label: 'Approve as Manager', variant: 'approve' },
    { action: 'REJECT_MANAGER',  label: 'Reject',             variant: 'reject', needsComment: true },
    { action: 'CANCEL',          label: 'Withdraw',           variant: 'neutral' },
  ],
  MANAGER_APPROVED: [
    { action: 'APPROVE_HR', label: 'Final-approve as HR', variant: 'approve' },
    { action: 'REJECT_HR',  label: 'Reject',              variant: 'reject', needsComment: true },
  ],
  HR_APPROVED:      [{ action: 'REVOKE', label: 'Revoke Approval', variant: 'reject', needsComment: true }],
  REJECTED:         [],
  CANCELLED:        [],
};

function formatDateRange(start: string, end: string): { label: string; days: number } {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const fmt = (d: Date) => new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  return { label: `${fmt(s)} – ${fmt(e)}`, days };
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function LeaveDetailsModal({
  leaveRequestId, onClose, onAction, actionBusy, actionError,
}: Props) {
  const isOpen = !!leaveRequestId;
  const { data, isLoading, refresh } = useApi<TimelinePayload>(
    isOpen ? `/api/leave/requests/${leaveRequestId}/timeline` : null,
    { pollMs: false },
  );

  const [comment, setComment] = useState('');
  const [pingState, setPingState] = useState<{
    busy: boolean;
    error: string | null;
    success: string | null;
  }>({ busy: false, error: null, success: null });

  // Reset transient state when the modal target changes.
  useEffect(() => {
    if (isOpen) {
      setComment('');
      setPingState({ busy: false, error: null, success: null });
    }
  }, [isOpen, leaveRequestId]);

  const r = data?.request;
  const period = useMemo(
    () => r ? formatDateRange(r.startDate, r.endDate) : null,
    [r],
  );

  const availableActions = r ? (ACTIONS_FOR_STATE[r.status] ?? []) : [];

  const handlePing = async () => {
    if (!leaveRequestId) return;
    setPingState({ busy: true, error: null, success: null });
    try {
      const res = await apiMutate<undefined, { recipientCount: number; nextRole: string }>(
        `/api/leave/requests/${leaveRequestId}/ping`, 'POST',
      );
      setPingState({
        busy: false, error: null,
        success: `Pinged ${res.recipientCount} ${res.nextRole}${res.recipientCount === 1 ? '' : 's'} for approval.`,
      });
      await refresh();
    } catch (err: any) {
      setPingState({ busy: false, error: err?.message ?? 'Could not send ping', success: null });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Request" subtitle={r?.id} size="lg">
      {!data || isLoading ? (
        <div className="p-12 text-center text-[12px] text-slate-500">Loading…</div>
      ) : !r ? (
        <div className="p-12 text-center text-[12px] text-slate-500">Request not found.</div>
      ) : (
        <div className="space-y-8 animate-in">
          {/* ── Summary ─── */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[20px] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                  {`${r.employee.firstName[0] ?? ''}${r.employee.lastName[0] ?? ''}`}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-slate-900 leading-none mb-1">
                    {r.employee.firstName} {r.employee.lastName}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {r.employee.jobTitle}
                  </div>
                </div>
              </div>
              <WorkflowStatusBadge state={r.status} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <Field label="Leave Type" value={r.type} />
              <Field label="Period" value={period?.label ?? '—'} />
              <Field label="Days" value={`${period?.days ?? 0}`} />
            </div>
            {r.reason && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Reason
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed">{r.reason}</p>
              </div>
            )}
          </div>

          {/* ── Approval Timeline + Awaiting ─── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Approval Timeline</h4>
            </div>
            <TimelineList history={data.history} />

            {data.nextRole && data.nextApprovers.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="text-[12px] font-bold text-amber-900">
                    Awaiting {data.nextRole.replace('_', ' ').toLowerCase()} approval
                  </div>
                  <div className="text-[11px] text-amber-700">
                    {data.nextApprovers.map(a => a.name).join(', ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePing}
                  disabled={pingState.busy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 transition-all"
                >
                  <Bell className="w-3 h-3" />
                  {pingState.busy ? 'Pinging…' : 'Ping for Approval'}
                </button>
              </div>
            )}

            {pingState.error && (
              <InlineAlert tone="rose" message={pingState.error} />
            )}
            {pingState.success && (
              <InlineAlert tone="emerald" message={pingState.success} />
            )}
          </div>

          {/* ── Actions (only when caller passes onAction) ─── */}
          {onAction && availableActions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Governance Authorization</h4>
              </div>
              {availableActions.some(a => a.needsComment) && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment (recommended for rejection / revocation)"
                  rows={2}
                  aria-label="Action comment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {availableActions.map(a => {
                  const variantClass =
                    a.variant === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      : a.variant === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200';
                  const Icon =
                    a.variant === 'approve' ? CheckCircle2 : a.variant === 'reject' ? XCircle : User;
                  return (
                    <button
                      key={a.action}
                      type="button"
                      disabled={actionBusy}
                      onClick={() => onAction(a.action, a.needsComment ? (comment.trim() || undefined) : undefined)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all disabled:opacity-60 ${variantClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {a.label}
                    </button>
                  );
                })}
              </div>
              {actionError && <InlineAlert tone="rose" message={actionError} />}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-[14px] font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TimelineList({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] text-slate-500">
        No approval activity yet.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {history.map((h, i) => {
        const tone =
          h.action.startsWith('APPROVE') ? 'emerald'
          : h.action.startsWith('REJECT') || h.action === 'REVOKE' ? 'rose'
          : 'slate';
        const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'rose' ? XCircle : User;
        return (
          <li
            key={h.id ?? i}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              tone === 'emerald' ? 'bg-emerald-50 border-emerald-100'
              : tone === 'rose' ? 'bg-rose-50 border-rose-100'
              : 'bg-slate-50 border-slate-100'
            }`}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
              tone === 'emerald' ? 'text-emerald-600'
              : tone === 'rose' ? 'text-rose-600'
              : 'text-slate-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold text-slate-900">{h.actorName}</span>
                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {h.actorRole}
                </span>
                <span className="text-[11px] text-slate-600">{actionLabel(h.action)}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{formatTimestamp(h.timestamp)}</span>
              </div>
              {h.comment && (
                <div className="text-[12px] text-slate-700 mt-1 italic">&ldquo;{h.comment}&rdquo;</div>
              )}
              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                {h.fromState} → {h.toState}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function actionLabel(a: string): string {
  switch (a) {
    case 'SUBMIT': return 'submitted the request';
    case 'APPROVE_MANAGER': return 'approved as manager';
    case 'APPROVE_HR': return 'gave final HR approval';
    case 'REJECT_MANAGER':
    case 'REJECT_HR':
      return 'rejected the request';
    case 'CANCEL': return 'withdrew the request';
    case 'REVOKE': return 'revoked prior approval';
    default: return a.toLowerCase().replace(/_/g, ' ');
  }
}

function InlineAlert({ tone, message }: { tone: 'rose' | 'emerald'; message: string }) {
  const palette =
    tone === 'rose'
      ? { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', icon: 'text-rose-500' }
      : { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' };
  const Icon = tone === 'rose' ? AlertTriangle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2 p-3 ${palette.bg} border ${palette.border} rounded-xl`}>
      <Icon className={`w-4 h-4 ${palette.icon} mt-0.5 shrink-0`} />
      <span className={`text-[12px] font-medium ${palette.text} leading-relaxed`}>{message}</span>
    </div>
  );
}
