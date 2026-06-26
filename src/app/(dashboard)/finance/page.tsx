"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, Target, Activity, ShieldCheck, TrendingUp, ArrowRight,
  Plus, Zap, PieChart, CreditCard, AlertTriangle, History, FileText,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RouteGuard } from '@/components/common/RouteGuard';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Permissions } from '@/modules/auth/domain/permission.model';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { ExpenditureSubmitModal } from '@/components/finance/ExpenditureSubmitModal';
import { BudgetFormModal } from '@/components/finance/BudgetFormModal';

// ─── API shapes ──────────────────────────────────────────────────────────────

interface BudgetRow {
  id:            string;
  name:          string;
  fiscalYear:    string;
  period:        string;
  status:        'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  totalAmount:   string | number;
  allocatedAmount: string | number;
  spentAmount:   string | number;
  currency:      string;
  department:    { id: string; name: string } | null;
  utilization?:  { remainingAmount: number; utilizationPercent: number };
}

interface ExpenditureRow {
  id:          string;
  description: string;
  amount:      string | number;
  status:      'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CANCELLED';
  vendor:      string | null;
  reference:   string | null;
  createdAt:   string;
  budget:      { id: string; name: string; currency?: string };
  category:    { id: string; name: string; code: string | null } | null;
  requestedBy: { id: string; staffId: string; firstName: string; lastName: string; jobTitle?: string };
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function fmtNGN(v: string | number | null | undefined): string {
  return `₦${num(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

// Status badges share tone vocabulary with /finance/approvals.
const EXPENDITURE_TONE: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-100',
  APPROVED:  'bg-sky-50 text-sky-700 border-sky-100',
  REJECTED:  'bg-rose-50 text-rose-700 border-rose-100',
  DISBURSED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const BUDGET_TONE: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600 border-slate-200',
  ACTIVE:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOSED:   'bg-slate-100 text-slate-500 border-slate-200',
  ARCHIVED: 'bg-slate-50 text-slate-400 border-slate-100',
};

export default function FinanceDashboard() {
  const { userRole, checkPermission } = useAccess();
  const isFinance = userRole === 'FINANCE_MANAGER' || userRole === 'SUPER_ADMIN';
  const canAllocate = checkPermission(Permissions.FINANCE_ALLOCATE as any).allowed;

  const [submitOpen, setSubmitOpen] = useState(false);
  const [newBudgetOpen, setNewBudgetOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Two SWR feeds. Finance roles see DRAFT + ACTIVE budgets so they
  // can activate fresh ones from this view; everyone else just sees
  // ACTIVE (the ones they can actually spend against).
  const budgetsUrl = isFinance
    ? '/api/finance/budgets?includeUtilization=true'
    : '/api/finance/budgets?status=ACTIVE&includeUtilization=true';
  const { data: budgetsAll = [], refresh: refreshBudgets } = useApi<BudgetRow[]>(
    budgetsUrl,
    { pollMs: 30_000 },
  );
  // Hide CLOSED + ARCHIVED from the dashboard view — the dedicated
  // budget detail page (future) is the place for archived history.
  const budgets = useMemo(
    () => budgetsAll.filter(b => b.status === 'ACTIVE' || b.status === 'DRAFT'),
    [budgetsAll],
  );
  const expScope = isFinance ? 'team' : 'mine';
  const { data: expenditures = [], refresh: refreshExp } = useApi<ExpenditureRow[]>(
    `/api/finance/expenditures?scope=${expScope}`,
    { pollMs: 15_000 },
  );

  // ── Real metrics ──────────────────────────────────────────────────
  // Allocated/spent come straight off the budget rows; burn rate is
  // their ratio. Pending approvals counts queue items the user can
  // act on — for non-finance viewers this is the count of their own
  // outstanding requests, which is the more useful number for them.
  const totals = useMemo(() => {
    let totalAllocated = 0, totalSpent = 0;
    for (const b of budgets) {
      totalAllocated += num(b.totalAmount);
      totalSpent     += num(b.spentAmount);
    }
    const pendingApproval = expenditures.filter(e => e.status === 'SUBMITTED').length;
    const pendingDisbursement = expenditures.filter(e => e.status === 'APPROVED').length;
    return {
      totalAllocated,
      totalSpent,
      burnRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
      pendingApproval,
      pendingDisbursement,
    };
  }, [budgets, expenditures]);

  // Status-aware action runner; same transition endpoint /finance/approvals uses.
  async function transition(id: string, action: 'APPROVE_FINANCE' | 'REJECT_FINANCE' | 'DISBURSE', comment?: string) {
    setBusyId(id);
    setBannerError(null);
    try {
      await apiMutate(`/api/finance/expenditures/${id}/transition`, 'PATCH', { action, comment });
      await Promise.all([refreshExp(), refreshBudgets()]);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  }

  // Budget-level state transition. ACTIVATE moves DRAFT → ACTIVE so it
  // can accept expenditures; CLOSE seals an ACTIVE budget against new
  // requests. Both gated server-side on finance:allocate.
  async function transitionBudget(id: string, action: 'ACTIVATE' | 'CLOSE') {
    setBusyId(id);
    setBannerError(null);
    try {
      await apiMutate(`/api/finance/budgets/${id}`, 'PATCH', { action });
      await refreshBudgets();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Budget transition failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER', 'MANAGER', 'EMPLOYEE']}>
      <div className="section-breathing max-w-[1500px] mx-auto animate-in space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  Finance
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
                Budgets &amp; Expenditure
              </h1>
              <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[600px]">
                Active budgets with live utilization. Submit a request against an active budget; Finance reviews and disburses through the approvals queue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PermissionGate permission={Permissions.FINANCE_VIEW} showLocked>
                <button
                  type="button"
                  onClick={() => setSubmitOpen(true)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 px-5 h-11 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Request Funds
                </button>
              </PermissionGate>
              {canAllocate && (
                <button
                  type="button"
                  onClick={() => setNewBudgetOpen(true)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 px-5 h-11 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Budget
                </button>
              )}
              {isFinance && (
                <Link
                  href="/finance/approvals"
                  className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-5 h-11 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md"
                >
                  Approvals Queue
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {bannerError && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{bannerError}</span>
          </div>
        )}

        {/* KPIs — all derived from the live feeds; no hardcoded trends. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricCard label="Allocated"        value={fmtNGN(totals.totalAllocated)}   icon={PieChart}    variant="tonal-info" />
          <MetricCard label="Spent"            value={fmtNGN(totals.totalSpent)}       icon={TrendingUp}  variant="tonal-info" />
          <MetricCard
            label="Burn Rate"
            value={`${totals.burnRate.toFixed(1)}%`}
            icon={Activity}
            variant={totals.burnRate >= 90 ? 'tonal-warning' : 'tonal-success'}
          />
          <MetricCard
            label={isFinance ? 'Pending Approvals' : 'My Pending Requests'}
            value={`${totals.pendingApproval}`}
            icon={ShieldCheck}
            variant={totals.pendingApproval > 0 ? 'tonal-warning' : 'tonal-success'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Active budgets */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Active Budgets</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{budgets.length}</span>
            </div>

            {budgets.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-[20px] text-center text-[13px] text-slate-500">
                No active budgets. {canAllocate && 'Create one to enable expenditure requests.'}
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map(b => {
                  const total = num(b.totalAmount);
                  const spent = num(b.spentAmount);
                  const pct = total > 0 ? (spent / total) * 100 : 0;
                  return (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[14px] font-bold text-slate-900 truncate">{b.name}</h3>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${BUDGET_TONE[b.status] ?? BUDGET_TONE.DRAFT}`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {b.fiscalYear} · {b.period}{b.department ? ` · ${b.department.name}` : ''}
                          </div>
                        </div>
                        <a
                          href={`/api/finance/budgets/${b.id}/report`}
                          aria-label={`Download report for ${b.name}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </a>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500">{fmtNGN(spent)} of {fmtNGN(total)}</span>
                          <span className={`font-bold ${pct >= 90 ? 'text-rose-600' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            ref={(el) => { if (el) el.style.width = `${Math.min(100, pct)}%`; }}
                          />
                        </div>
                      </div>

                      {/* Allocate-gated lifecycle controls. DRAFT → Activate
                          (visually emphasized; without this the budget can't
                          accept expenditures). ACTIVE → Close (lower-key;
                          locks the period). */}
                      {canAllocate && (b.status === 'DRAFT' || b.status === 'ACTIVE') && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          {b.status === 'DRAFT' && (
                            <button type="button"
                              onClick={() => transitionBudget(b.id, 'ACTIVATE')}
                              disabled={busyId === b.id}
                              className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              {busyId === b.id ? 'Activating…' : 'Activate'}
                            </button>
                          )}
                          {b.status === 'ACTIVE' && (
                            <button type="button"
                              onClick={() => {
                                if (!confirm(`Close "${b.name}"? No new expenditures can be submitted against it.`)) return;
                                transitionBudget(b.id, 'CLOSE');
                              }}
                              disabled={busyId === b.id}
                              className="px-4 h-9 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              {busyId === b.id ? 'Closing…' : 'Close Period'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expenditure queue */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                  {isFinance ? 'Pending Requests' : 'My Requests'}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{expenditures.length}</span>
            </div>

            {expenditures.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-[20px] text-center text-[13px] text-slate-500">
                {isFinance ? 'No requests in your queue.' : 'You have no expenditure requests in flight.'}
              </div>
            ) : (
              <div className="space-y-3">
                {expenditures.map(e => {
                  const canApprove = isFinance && e.status === 'SUBMITTED' && checkPermission(Permissions.FINANCE_APPROVE as any).allowed;
                  const canReject  = isFinance && e.status === 'SUBMITTED' && checkPermission(Permissions.FINANCE_APPROVE as any).allowed;
                  const canDisburse = isFinance && e.status === 'APPROVED' && checkPermission(Permissions.FINANCE_DISBURSE as any).allowed;
                  return (
                    <div key={e.id} className="bg-white border border-slate-200 rounded-[20px] p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-900 truncate">{e.description}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {e.budget.name}{e.category ? ` · ${e.category.name}` : ''}{e.vendor ? ` · ${e.vendor}` : ''}
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap ${EXPENDITURE_TONE[e.status] ?? EXPENDITURE_TONE.DRAFT}`}>
                          {e.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <EmployeeChip
                          employeeId={e.requestedBy.id}
                          name={`${e.requestedBy.firstName} ${e.requestedBy.lastName}`}
                          sublabel={fmtDate(e.createdAt)}
                          size="sm"
                        />
                        <span className="text-[14px] font-black text-slate-900 whitespace-nowrap">{fmtNGN(e.amount)}</span>
                      </div>

                      {rejectingId === e.id ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <input
                            value={rejectReason}
                            onChange={(ev) => setRejectReason(ev.target.value)}
                            placeholder="Reason for rejection (visible to requester)"
                            aria-label="Rejection reason"
                            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[12px] outline-none focus:border-rose-500"
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              disabled={busyId === e.id}
                              className="flex-1 h-9 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              Cancel
                            </button>
                            <button type="button"
                              onClick={() => transition(e.id, 'REJECT_FINANCE', rejectReason.trim() || undefined)}
                              disabled={busyId === e.id || !rejectReason.trim()}
                              className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              {busyId === e.id ? 'Rejecting…' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ) : (canApprove || canReject || canDisburse) && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          {canApprove && (
                            <button type="button"
                              onClick={() => transition(e.id, 'APPROVE_FINANCE')}
                              disabled={busyId === e.id}
                              className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              Approve
                            </button>
                          )}
                          {canDisburse && (
                            <button type="button"
                              onClick={() => transition(e.id, 'DISBURSE')}
                              disabled={busyId === e.id}
                              className="flex-1 h-9 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              Disburse
                            </button>
                          )}
                          {canReject && (
                            <button type="button"
                              onClick={() => setRejectingId(e.id)}
                              disabled={busyId === e.id}
                              className="px-4 h-9 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60">
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ExpenditureSubmitModal
          isOpen={submitOpen}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={() => { refreshExp(); refreshBudgets(); }}
        />
        <BudgetFormModal
          isOpen={newBudgetOpen}
          onClose={() => setNewBudgetOpen(false)}
          onSaved={() => { setNewBudgetOpen(false); refreshBudgets(); }}
        />
      </div>
    </RouteGuard>
  );
}
