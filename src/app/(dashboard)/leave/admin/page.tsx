"use client";

import React, { useMemo, useState } from 'react';
import {
  Activity, Plus, ShieldCheck, Calendar, Clock, User,
  CheckCircle2, XCircle, Edit3, Trash2, Power, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { Modal } from "@/components/common/Modal";
import { WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowStatusBadge } from '@/components/workflow/WorkflowUI';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useApi, useApiMutation } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Approval Pipeline', 'Leave Calendar', 'Balance Tracker', 'Leave Types'];

// ─── Leave-type colour palette ────────────────────────────────────────────────
// The leave_types.color column holds a token (e.g. "indigo"); this map
// resolves each token to the matching Tailwind utility classes. Adding a
// new colour: append a row here and the picker in CreateLeaveTypeModal
// will surface it automatically.
const COLOR_TOKENS: Record<string, { text: string; bg: string; border: string; dot: string; label: string }> = {
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-500', label: 'Indigo' },
  rose:   { text: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100',   dot: 'bg-rose-500',   label: 'Rose'   },
  amber:  { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100',  dot: 'bg-amber-500',  label: 'Amber'  },
  pink:   { text: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-100',   dot: 'bg-pink-500',   label: 'Pink'   },
  sky:    { text: 'text-sky-600',    bg: 'bg-sky-50',    border: 'border-sky-100',    dot: 'bg-sky-500',    label: 'Sky'    },
  emerald:{ text: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100',dot: 'bg-emerald-500',label: 'Emerald'},
  slate:  { text: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-100',  dot: 'bg-slate-500',  label: 'Slate'  },
};
const NEUTRAL_PALETTE = COLOR_TOKENS.slate;

function paletteFor(token: string | null | undefined) {
  if (!token) return NEUTRAL_PALETTE;
  return COLOR_TOKENS[token] ?? NEUTRAL_PALETTE;
}

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiLeaveType {
  id: string;
  code: string;
  name: string;
  quotaDays: number;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

interface ApiLeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  workflowInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; staffId: string; firstName: string; lastName: string };
}

interface TableRow {
  id: string;
  employeeName: string;
  type: string;
  dates: string;
  days: number;
  currentState: string;
  updatedAt: string;
  raw: ApiLeaveRequest;
}

function formatDates(start: string, end: string): { label: string; days: number } {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(d);
  return { label: `${fmt(s)} – ${fmt(e)}`, days };
}

// ─── Workflow action UX ───────────────────────────────────────────────────────
// Drives the explicit Approve / Reject / Cancel buttons in the drawer. Each
// entry's `action` is the workflow action key the transition API expects.
const ACTIONS_FOR_STATE: Record<string, Array<{
  action: WorkflowAction;
  label: string;
  variant: 'approve' | 'reject' | 'neutral';
  needsComment?: boolean;
}>> = {
  DRAFT:            [{ action: 'CANCEL', label: 'Withdraw', variant: 'neutral' }],
  SUBMITTED:        [
    { action: 'APPROVE_MANAGER', label: 'Approve as Manager',  variant: 'approve' },
    { action: 'REJECT_MANAGER',  label: 'Reject',              variant: 'reject', needsComment: true },
    { action: 'CANCEL',          label: 'Withdraw',            variant: 'neutral' },
  ],
  MANAGER_APPROVED: [
    { action: 'APPROVE_HR', label: 'Final-approve as HR', variant: 'approve' },
    { action: 'REJECT_HR',  label: 'Reject',              variant: 'reject', needsComment: true },
  ],
  HR_APPROVED:      [{ action: 'REVOKE', label: 'Revoke Approval', variant: 'reject', needsComment: true }],
  REJECTED:         [],
  CANCELLED:        [],
};

export default function LeaveRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<TableRow | null>(null);
  const [tab, setTab] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  // Leave-type catalogue — drives the request-type label, type-tab cards,
  // and (when used elsewhere) the submission form's type dropdown.
  const { data: leaveTypes = [], refresh: refreshLeaveTypes } =
    useApi<ApiLeaveType[]>('/api/leave/types', { pollMs: 60_000 });

  // ALL active leave requests from the DB. SUPER_ADMIN / HR_ADMIN get
  // every record via scope=all; managers should use /leave/approvals
  // (different scope) — this page is the admin-wide registry.
  const { data: apiRequests, refresh } =
    useApi<ApiLeaveRequest[]>('/api/leave/requests?scope=all&limit=200', { pollMs: 30_000 });

  const transitionMutation = useApiMutation<
    { action: WorkflowAction; comment?: string },
    unknown
  >(
    () => `/api/leave/requests/${selectedRequest?.id ?? ''}/transition`,
    'PATCH',
  );

  // Build a code→displayName map from the live catalogue so historical
  // requests render their human-readable type even if the catalogue evolves.
  const typeLabel = useMemo(() => {
    const m: Record<string, string> = {};
    leaveTypes.forEach(t => { m[t.code] = t.name; });
    return m;
  }, [leaveTypes]);

  const requests = useMemo<TableRow[]>(() => {
    if (!apiRequests) return [];
    return apiRequests.map((r) => {
      const { label, days } = formatDates(r.startDate, r.endDate);
      return {
        id: r.id,
        employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
        type: typeLabel[r.type] ?? r.type,
        dates: label,
        days,
        currentState: r.status,
        updatedAt: r.updatedAt,
        raw: r,
      };
    });
  }, [apiRequests, typeLabel]);

  const handleAction = async (action: WorkflowAction, comment?: string) => {
    if (!selectedRequest) return;
    setActionError(null);
    setActionBusy(true);
    try {
      await transitionMutation.trigger({ action, comment });
      await refresh();
      setSelectedRequest(null);
      setRejectComment('');
    } catch (err: any) {
      // Server-side guard surfaces 403 / 409 / 400 errors with descriptive
      // messages — show them inline so the actor knows whether it was an
      // authorization issue, state-machine violation, or validation failure.
      const msg = err?.message ?? 'Transition failed';
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const columns = [
    {
      header: "Staff Member", accessor: "employeeName",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
            {val.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.type}</div>
          </div>
        </div>
      )
    },
    {
      header: "Period", accessor: "dates",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[13px] font-bold text-slate-700">{val}</div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{row.days} day{row.days !== 1 ? 's' : ''}</div>
        </div>
      )
    },
    {
      header: "Status", accessor: "currentState",
      render: (val: string) => <WorkflowStatusBadge state={val} />
    },
    {
      header: "Updated", accessor: "updatedAt",
      render: (val: string) => (
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(val))}
        </span>
      )
    }
  ];

  const pending = requests.filter(r => r.currentState === 'SUBMITTED').length;
  const totalDaysOut = requests.reduce((s, r) => s + r.days, 0);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Workflow Engine Active
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Leave Management
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Manage organization-wide leave requests, approval pipelines, balances, and team availability.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all">
              Export Registry
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Pending Approvals" value={`${pending}`} trend={{ direction: 'up', value: '2' }} variant="tonal-warning" icon={Clock} />
        <MetricCard label="Active Workflows" value={`${requests.length}`} variant="tonal-info" icon={Activity} />
        <MetricCard label="Days Out This Month" value={`${totalDaysOut}`} variant="tonal-info" icon={Calendar} />
        <MetricCard label="Escalations" value="0" variant="tonal-success" icon={ShieldCheck} />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
              tab === i ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Approval Pipeline ─────────────────────────────────────── */}
      {tab === 0 && (
        <>
          <DataTable
            title="Active Workflow Pipelines"
            description="Real-time status of organization-wide leave requests and approval steps."
            data={requests}
            columns={columns}
            onRowClick={(row) => setSelectedRequest(row)}
          />

          <Drawer
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            title={`Leave Request: ${selectedRequest?.employeeName}`}
            subtitle={selectedRequest?.id as any}
          >
            <div className="space-y-10 animate-in">
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[20px] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-[13px] font-bold text-slate-900">{selectedRequest?.employeeName}</span>
                  </div>
                  <WorkflowStatusBadge state={selectedRequest?.currentState || ''} />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Leave Type</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.type}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Period</span>
                    <p className="text-[14px] font-bold text-slate-900">{selectedRequest?.dates}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Days</span>
                    <p className="text-[14px] font-bold text-slate-900">{(selectedRequest as any)?.days}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Governance Authorization</h4>
                </div>
                {(() => {
                  const state = selectedRequest?.currentState ?? '';
                  const available = ACTIONS_FOR_STATE[state] ?? [];
                  if (available.length === 0) {
                    return (
                      <div className="flex items-center gap-3 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                          Workflow is in a terminal state — no further actions available.
                        </span>
                      </div>
                    );
                  }
                  const needsCommentForAny = available.some(a => a.needsComment);
                  return (
                    <div className="space-y-3">
                      {needsCommentForAny && (
                        <textarea
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          placeholder="Optional comment (required for rejection / revocation)"
                          rows={2}
                          aria-label="Action comment"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                        />
                      )}
                      <div className="flex flex-wrap gap-2">
                        {available.map(a => {
                          const variantClass =
                            a.variant === 'approve'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              : a.variant === 'reject'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200';
                          const Icon =
                            a.variant === 'approve' ? CheckCircle2 : a.variant === 'reject' ? XCircle : Activity;
                          return (
                            <button
                              key={a.action}
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleAction(a.action, a.needsComment ? rejectComment.trim() || undefined : undefined)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all disabled:opacity-60 ${variantClass}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                      {actionError && (
                        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{actionError}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Drawer>
        </>
      )}

      {/* ── TAB 1: Leave Calendar ─────────────────────────────────────────── */}
      {tab === 1 && <LeaveCalendarTab leaveTypes={leaveTypes} />}

      {/* ── TAB 2: Balance Tracker ─────────────────────────────────────────── */}
      {tab === 2 && <BalanceTrackerTab />}

      {/* ── TAB 3: Leave Types (DB-backed CRUD) ───────────────────────────── */}
      {tab === 3 && (
        <LeaveTypesTab leaveTypes={leaveTypes} onRefresh={refreshLeaveTypes} />
      )}

    </div>
  );
}

// ─── Tab 3 component + modals ────────────────────────────────────────────────

function LeaveTypesTab({
  leaveTypes,
  onRefresh,
}: {
  leaveTypes: ApiLeaveType[];
  onRefresh: () => Promise<unknown>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiLeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiLeaveType | null>(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Leave Type Catalogue</h3>
          <p className="text-[12px] font-medium text-slate-500 mt-0.5">
            HR-managed list of leave categories. Edits apply immediately to new submissions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Leave Type
        </button>
      </div>

      {leaveTypes.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-200 p-12 text-center space-y-3 mt-6">
          <span className="text-[13px] text-slate-500">No leave types yet. Add one to get started.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {leaveTypes.map(lt => {
            const palette = paletteFor(lt.color);
            return (
              <div
                key={lt.id}
                className={`${palette.bg} border ${palette.border} rounded-[24px] p-6 space-y-4 ${!lt.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center ${palette.text} border ${palette.border}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${lt.name}`}
                      onClick={() => setEditTarget(lt)}
                      className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white border border-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${lt.name}`}
                      onClick={() => setDeleteTarget(lt)}
                      className="w-8 h-8 rounded-lg bg-white/70 hover:bg-rose-50 border border-white text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-slate-900">{lt.name}</h3>
                    {!lt.isActive && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed min-h-[36px]">
                    {lt.description ?? `${lt.code} — no description.`}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quota</span>
                  <span className={`text-xl font-black ${palette.text}`}>
                    {lt.quotaDays} <span className="text-[12px] font-bold text-slate-400">days</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LeaveTypeFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); onRefresh(); }}
      />

      <LeaveTypeFormModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        existing={editTarget ?? undefined}
        onSaved={() => { setEditTarget(null); onRefresh(); }}
      />

      <DeleteLeaveTypeModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); onRefresh(); }}
      />
    </>
  );
}

// CreateLeaveTypeModal + EditLeaveTypeModal collapsed into one form modal —
// the only behavioural difference is whether it POSTs or PATCHes, which is
// decided by whether `existing` is passed.
function LeaveTypeFormModal({
  isOpen, onClose, onSaved, existing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: ApiLeaveType;
}) {
  const editing = !!existing;
  const [code, setCode] = useState(existing?.code ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [quotaDays, setQuotaDays] = useState<number>(existing?.quotaDays ?? 14);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [color, setColor] = useState(existing?.color ?? 'indigo');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset state when target changes (edit modal reused across rows).
  React.useEffect(() => {
    if (!isOpen) return;
    setCode(existing?.code ?? '');
    setName(existing?.name ?? '');
    setQuotaDays(existing?.quotaDays ?? 14);
    setDescription(existing?.description ?? '');
    setColor(existing?.color ?? 'indigo');
    setIsActive(existing?.isActive ?? true);
    setError(null);
  }, [isOpen, existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editing) {
        await apiMutate(`/api/leave/types/${existing!.id}`, 'PATCH', {
          name, quotaDays, description: description || null, color, isActive,
        });
      } else {
        await apiMutate('/api/leave/types', 'POST', {
          code: code.toUpperCase(), name, quotaDays,
          description: description || null, color, isActive,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save leave type');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Leave Type' : 'New Leave Type'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</label>
          <input
            aria-label="Code"
            required
            disabled={editing}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. STUDY"
            className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 uppercase"
          />
          {editing && <p className="text-[10px] text-slate-400 px-1">Code is immutable — historical requests reference it.</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Display Name</label>
          <input
            aria-label="Display Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Study Leave"
            className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quota (days/year)</label>
            <input
              aria-label="Quota days"
              required
              type="number"
              min={0}
              max={365}
              value={quotaDays}
              onChange={(e) => setQuotaDays(Number(e.target.value))}
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colour</label>
            <select
              aria-label="Colour"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              {Object.entries(COLOR_TOKENS).map(([token, p]) => (
                <option key={token} value={token}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
          <textarea
            aria-label="Description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this leave type covers — shown on the type catalogue and submission form."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>

        {editing && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
              <Power className="w-3.5 h-3.5" />
              Active (employees can request this leave type)
            </span>
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md disabled:opacity-60"
        >
          {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Leave Type'}
        </button>
      </form>
    </Modal>
  );
}

function DeleteLeaveTypeModal({
  target, onClose, onDeleted,
}: {
  target: ApiLeaveType | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { if (target) setError(null); }, [target]);

  const handleDelete = async () => {
    if (!target) return;
    setError(null);
    setBusy(true);
    try {
      await apiMutate(`/api/leave/types/${target.id}`, 'DELETE');
      onDeleted();
    } catch (err: any) {
      // 409 HAS_DEPENDENTS means historical requests reference this type —
      // suggest disabling instead.
      setError(err?.message ?? 'Could not delete leave type');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={!!target} onClose={onClose} title="Delete Leave Type" size="sm">
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Delete &ldquo;{target?.name}&rdquo;?</h3>
            <p className="text-[12px] text-slate-500 mt-1 max-w-[300px]">
              This removes the leave type from the catalogue. If any historical requests reference it,
              the server will block deletion — disable it instead.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{error}</span>
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
            onClick={handleDelete}
            disabled={busy}
            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab 1 — Leave Calendar ──────────────────────────────────────────────────

interface CalendarEntry {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  isConfirmed: boolean;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  branch: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function LeaveCalendarTab({ leaveTypes }: { leaveTypes: ApiLeaveType[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // First day of the visible month, anchored to UTC noon to avoid edge-day
  // drift on locales that report negative offsets at midnight.
  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const monthEnd   = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor]);

  // Calendar grid spans Monday-of-week-containing-day-1 through
  // Sunday-of-week-containing-last-day, so we always render full weeks.
  // JS getDay: Sun=0, Mon=1, … — shift so Mon=0.
  const startDow = (monthStart.getDay() + 6) % 7;
  const fromDate = new Date(monthStart);
  fromDate.setDate(monthStart.getDate() - startDow);
  const endDow = (monthEnd.getDay() + 6) % 7;
  const toDate = new Date(monthEnd);
  toDate.setDate(monthEnd.getDate() + (6 - endDow));

  const { data: entries = [], isLoading } = useApi<CalendarEntry[]>(
    `/api/leave/calendar?from=${toISODate(fromDate)}&to=${toISODate(toDate)}`,
    { pollMs: 60_000 },
  );

  // Map each visible day → leave entries overlapping it. O(days × entries)
  // which is fine: a month is ≤42 cells and entries are bounded by the
  // overlap query.
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEntry[]>();
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const key = toISODate(cur);
      const day = new Date(cur);
      const hits = entries.filter(e => {
        const s = new Date(e.startDate);
        const ee = new Date(e.endDate);
        return day >= startOfDay(s) && day <= endOfDay(ee);
      });
      m.set(key, hits);
      cur.setDate(cur.getDate() + 1);
    }
    return m;
  }, [entries, fromDate, toDate]);

  // Resolve type code → palette token for chip colour.
  const colorByType = useMemo(() => {
    const m: Record<string, string> = {};
    leaveTypes.forEach(t => { m[t.code] = t.color ?? 'slate'; });
    return m;
  }, [leaveTypes]);

  const weeks: Date[][] = [];
  {
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
  }

  const prevMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday   = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth() &&
    d.getDate()     === today.getDate();

  const isInCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Team Availability Overview {isLoading && '· loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">{d}</div>
        ))}
        {weeks.flat().map((day, idx) => {
          const key = toISODate(day);
          const hits = byDay.get(key) ?? [];
          const dim = !isInCurrentMonth(day);
          const todayCell = isToday(day);
          return (
            <div
              key={idx}
              className={`min-h-[96px] rounded-xl p-1.5 border transition-all ${
                dim ? 'border-transparent bg-slate-50/40' : 'border-slate-100 hover:border-slate-200 bg-white'
              } ${todayCell ? 'bg-indigo-50 border-indigo-200' : ''}`}
            >
              <div className={`text-[11px] font-black mb-1.5 ${
                todayCell ? 'text-indigo-600' : dim ? 'text-slate-300' : 'text-slate-500'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {hits.slice(0, 3).map(h => {
                  const palette = paletteFor(colorByType[h.type]);
                  return (
                    <div
                      key={h.id}
                      title={`${h.employeeName} — ${h.type}${h.isConfirmed ? '' : ' (pending HR)'}`}
                      className={`${palette.bg} ${palette.text} ${h.isConfirmed ? '' : 'border border-dashed ' + palette.border} rounded-md px-1.5 py-0.5 text-[9px] font-bold truncate uppercase`}
                    >
                      {h.employeeName.split(' ')[0]}
                    </div>
                  );
                })}
                {hits.length > 3 && (
                  <div className="text-[8px] font-bold text-slate-400 pl-1">+{hits.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
        {leaveTypes.filter(t => t.isActive).slice(0, 6).map(t => {
          const palette = paletteFor(t.color);
          return (
            <div key={t.code} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.name}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending HR</span>
        </div>
      </div>
    </div>
  );
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

// ─── Tab 2 — Balance Tracker ─────────────────────────────────────────────────

interface BalanceRow {
  typeCode:  string;
  typeName:  string;
  color:     string | null;
  quota:     number;
  used:      number;
  remaining: number;
}
interface EmployeeBalanceRow {
  employeeId:   string;
  employeeName: string;
  jobTitle:     string;
  branch:       string | null;
  balances:     BalanceRow[];
}

function BalanceTrackerTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useApi<{ year: number; employees: EmployeeBalanceRow[] }>(
    `/api/leave/balances?year=${year}`,
    { pollMs: 60_000 },
  );

  const employees = data?.employees ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => e.employeeName.toLowerCase().includes(q));
  }, [employees, search]);

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Leave Balance Tracker</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {year} Entitlement vs Utilization {isLoading && '· loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            aria-label="Search employee"
            className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[12px] outline-none focus:border-indigo-300 w-[200px]"
          />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
            className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[12px] font-bold outline-none focus:border-indigo-300"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-[13px] text-slate-500">
            {employees.length === 0 ? 'No employees found.' : 'No employees match your search.'}
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(emp => (
            <div key={emp.employeeId} className="p-5 bg-slate-50 border border-slate-100 rounded-[20px] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-[14px] font-bold text-slate-900 block leading-none mb-1">{emp.employeeName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {emp.jobTitle}{emp.branch ? ` · ${emp.branch}` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {emp.balances.map(b => {
                  const palette = paletteFor(b.color);
                  const pct = b.quota > 0 ? Math.min(100, (b.used / b.quota) * 100) : 0;
                  return (
                    <div key={b.typeCode}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[10px] font-bold ${palette.text} uppercase tracking-widest truncate`}>{b.typeName}</span>
                        <span className="text-[10px] font-bold text-slate-600">{b.used}/{b.quota}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${palette.dot}`}
                          data-pct={pct}
                          ref={(el) => { if (el) el.style.width = `${pct}%`; }}
                        />
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {b.remaining} left
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
