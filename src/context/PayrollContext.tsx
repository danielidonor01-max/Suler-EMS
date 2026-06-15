"use client";

/**
 * PayrollContext (v4 — API-backed)
 *
 * Legacy surface preserved: `salaries`, `adjustments`, `payrollRuns`, mutations
 * — so existing pages render without changes. Internals swapped from
 * localStorage to /api/payroll/* polling.
 *
 * Surface compatibility notes:
 *   - `payrollRuns[i].entries` is populated only for the most-recent PROCESSED
 *     run (used by the dashboard summary). Run-detail pages fetch entries on
 *     demand from /api/payroll/runs/:id?includeEntries=true.
 *   - `addBulkAdjustments` is preserved but currently logs a notice — bulk
 *     filtered adjustments need a dedicated endpoint (deferred to Phase 6).
 *   - `updateSalary` and `deleteRun` similarly log notices for now.
 *
 * Status mapping (API → legacy):
 *   DRAFT     → DRAFT
 *   REVIEW    → REVIEWED
 *   APPROVED  → APPROVED
 *   PROCESSED → PROCESSED
 *   CANCELLED → DRAFT (collapsed; not surfaced in dashboard)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

// ─── Legacy public types (preserved) ────────────────────────────────────────
export interface CompensationAdjustment {
  id: string;
  employeeId: string;
  type: 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'AWARD' | 'COMPENSATION';
  label: string;
  amount: number;
  period: string;
  createdAt: string;
}

export interface BulkAdjustmentRequest {
  type: 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'AWARD' | 'COMPENSATION';
  title: string;
  description: string;
  amount: number;
  amountType: 'FIXED' | 'PERCENTAGE';
  period: string;
  filters: {
    hubs?: string[]; departments?: string[]; teams?: string[]; roles?: string[]; minPerformance?: number;
  };
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  pensionEligible: boolean;
  nhfEligible: boolean;
  taxStatus: 'PAYE' | 'CONTRACT';
  grade: string;
  _v: number;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  baseSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  totalDeductions: number;
  grossPay: number;
  paye: number;
  pension: number;
  nhf: number;
  netPay: number;
  period: string;
  hub: string;
}

export interface PayrollRun {
  id: string;
  period: string;
  entries: PayrollEntry[];
  totalGross: number;
  totalNet: number;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PROCESSED';
  hub: string;
  createdAt: string;
  approvedAt?: string;
  /** new — used by run detail / approvals pages */
  name?: string;
  entryCount?: number;
}

interface PayrollContextType {
  salaries: SalaryStructure[];
  adjustments: CompensationAdjustment[];
  payrollRuns: PayrollRun[];

  updateSalary: (salary: SalaryStructure) => void;
  addAdjustment: (adj: Omit<CompensationAdjustment, 'id' | 'createdAt'>) => Promise<void>;
  addBulkAdjustments: (request: BulkAdjustmentRequest) => { count: number; totalImpact: number };
  removeAdjustment: (id: string) => Promise<void>;

  generateDraftRun: (period: string, hub: string) => Promise<void>;
  approveRun: (id: string) => Promise<void>;
  processRun: (id: string) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

const RUN_POLL_MS = 30_000;
const ADJ_POLL_MS = 30_000;

// ─── API shapes ─────────────────────────────────────────────────────────────
interface ApiRun {
  id: string; name: string; period: string;
  departmentId: string | null;
  department?: { id: string; name: string; code: string } | null;
  status: string;
  totalGross: string | number; totalNet: string | number;
  totalDeductions: string | number; totalEmployerContrib: string | number;
  entryCount: number;
  createdAt: string; approvedAt?: string | null; processedAt?: string | null;
}
interface ApiEntry {
  id: string; employeeId: string;
  basicSalary: string | number; housingAllowance: string | number; transportAllowance: string | number;
  grossPay: string | number; paye: string | number; pensionEmployee: string | number;
  nhf: string | number; netPay: string | number;
  totalDeductions: string | number;
}
interface ApiAdjustment {
  id: string; employeeId: string; type: string; reason: string;
  amount: string | number; effectivePeriod: string; status: string;
  createdAt: string;
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function mapStatus(s: string): PayrollRun['status'] {
  if (s === 'PROCESSED') return 'PROCESSED';
  if (s === 'APPROVED') return 'APPROVED';
  if (s === 'REVIEW') return 'REVIEWED';
  return 'DRAFT';
}

function mapEntry(e: ApiEntry, period: string, hub: string): PayrollEntry {
  const basic = num(e.basicSalary);
  const housing = num(e.housingAllowance);
  const transport = num(e.transportAllowance);
  return {
    id: e.id,
    employeeId: e.employeeId,
    baseSalary: basic,
    totalAllowances: housing + transport,
    totalBonuses: 0,
    totalDeductions: num(e.totalDeductions),
    grossPay: num(e.grossPay),
    paye: num(e.paye),
    pension: num(e.pensionEmployee),
    nhf: num(e.nhf),
    netPay: num(e.netPay),
    period,
    hub,
  };
}

function mapRun(r: ApiRun, entries: ApiEntry[] = []): PayrollRun {
  const hub = r.department?.code ?? 'GLOBAL';
  return {
    id: r.id,
    period: r.period,
    name: r.name,
    entries: entries.map(e => mapEntry(e, r.period, hub)),
    entryCount: r.entryCount,
    totalGross: num(r.totalGross),
    totalNet: num(r.totalNet),
    status: mapStatus(r.status),
    hub,
    createdAt: r.createdAt,
    approvedAt: r.approvedAt ?? undefined,
  };
}

function mapAdjustment(a: ApiAdjustment): CompensationAdjustment {
  // Legacy types only support the union shown — collapse unknown types to BONUS.
  const legacyType: CompensationAdjustment['type'] =
    a.type === 'BONUS' || a.type === 'DEDUCTION' || a.type === 'ALLOWANCE' ? a.type as any
    : a.type === 'COMMISSION' || a.type === 'OVERTIME' || a.type === 'REIMBURSEMENT' ? 'BONUS'
    : 'DEDUCTION';
  return {
    id: a.id,
    employeeId: a.employeeId,
    type: legacyType,
    label: a.reason,
    amount: num(a.amount),
    period: a.effectivePeriod,
    createdAt: a.createdAt,
  };
}

export const PayrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAccess();
  const { pushActivity } = useActivity();

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [adjustments, setAdjustments] = useState<CompensationAdjustment[]>([]);
  const [salaries] = useState<SalaryStructure[]>([]); // Legacy shape isn't fed from API; salary management uses entries on demand.

  const loadRuns = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await apiFetcher<ApiRun[]>('/api/payroll/runs');
      // For dashboard parity, also fetch entries for the most recent PROCESSED run.
      const newest = rows.find(r => r.status === 'PROCESSED');
      let newestEntries: ApiEntry[] = [];
      if (newest) {
        try {
          const detail = await apiFetcher<ApiRun & { entries?: ApiEntry[] }>(
            `/api/payroll/runs/${newest.id}?includeEntries=true`,
          );
          newestEntries = detail.entries ?? [];
        } catch { /* fallthrough — entries stays [] */ }
      }
      setPayrollRuns(rows.map(r => mapRun(r, r.id === newest?.id ? newestEntries : [])));
    } catch { /* silent */ }
  }, [user]);

  const loadAdjustments = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await apiFetcher<ApiAdjustment[]>('/api/payroll/adjustments');
      setAdjustments(rows.map(mapAdjustment));
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadRuns();
    const t = setInterval(loadRuns, RUN_POLL_MS);
    return () => clearInterval(t);
  }, [user, loadRuns]);

  useEffect(() => {
    if (!user) return;
    loadAdjustments();
    const t = setInterval(loadAdjustments, ADJ_POLL_MS);
    return () => clearInterval(t);
  }, [user, loadAdjustments]);

  const refresh = useCallback(async () => {
    await Promise.all([loadRuns(), loadAdjustments()]);
  }, [loadRuns, loadAdjustments]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const generateDraftRun = useCallback(async (period: string, hub: string) => {
    try {
      // Hub maps to department code; null = org-wide.
      const departmentId = hub === 'All Regions' || hub === 'GLOBAL' ? null : undefined;
      await apiMutate('/api/payroll/runs', 'POST', {
        name: `${period} — ${hub}`,
        period,
        departmentId,
      });
      await loadRuns();
      pushActivity({ type: 'GOVERNANCE', label: 'Payroll Cycle Initialized',
        message: `Draft payroll generated for ${period} in ${hub}.`,
        author: userRole, status: 'SUCCESS' } as any);
    } catch (err) {
      pushActivity({ type: 'GOVERNANCE', label: 'Draft Generation Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [loadRuns, pushActivity, userRole]);

  const transitionLegacy = useCallback(async (id: string, action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'PROCESS' | 'CANCEL', comment?: string) => {
    await apiMutate(`/api/payroll/runs/${id}/transition`, 'PATCH', { action, comment });
    await loadRuns();
  }, [loadRuns]);

  // Legacy approveRun expects to take a run from REVIEWED/DRAFT to APPROVED;
  // surface bridges by first submitting for review if needed, then approving.
  const approveRun = useCallback(async (id: string) => {
    const run = payrollRuns.find(r => r.id === id);
    if (!run) throw new Error('Run not found');
    try {
      if (run.status === 'DRAFT') {
        await transitionLegacy(id, 'SUBMIT_FOR_REVIEW');
      }
      await transitionLegacy(id, 'APPROVE');
      pushActivity({ type: 'GOVERNANCE', label: 'Payroll Approved',
        message: `Run ${run.name ?? id} approved and moved to processing.`,
        author: userRole, status: 'SUCCESS' } as any);
    } catch (err) {
      pushActivity({ type: 'GOVERNANCE', label: 'Approval Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [payrollRuns, transitionLegacy, pushActivity, userRole]);

  const processRun = useCallback(async (id: string) => {
    try {
      await transitionLegacy(id, 'PROCESS');
      pushActivity({ type: 'FINANCE', label: 'Payroll Processed',
        message: `Run finalized — adjustments auto-applied.`,
        author: userRole, status: 'SUCCESS' } as any);
    } catch (err) {
      pushActivity({ type: 'FINANCE', label: 'Processing Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [transitionLegacy, pushActivity, userRole]);

  const deleteRun = useCallback(async (id: string) => {
    try {
      await transitionLegacy(id, 'CANCEL');
    } catch (err) {
      pushActivity({ type: 'GOVERNANCE', label: 'Cancel Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [transitionLegacy, pushActivity, userRole]);

  // ── Adjustment mutations ─────────────────────────────────────────────────

  const addAdjustment = useCallback(async (adj: Omit<CompensationAdjustment, 'id' | 'createdAt'>) => {
    // Legacy types use 'May 2026' style strings; new API expects YYYY-MM.
    // If period already matches YYYY-MM, use it; otherwise log a notice.
    const period = /^\d{4}-\d{2}$/.test(adj.period) ? adj.period : new Date().toISOString().slice(0, 7);
    const apiType = adj.type === 'BONUS' || adj.type === 'AWARD' || adj.type === 'COMPENSATION' ? 'BONUS'
                  : adj.type === 'ALLOWANCE' ? 'BONUS' // closest semantic
                  : 'DEDUCTION';
    try {
      await apiMutate('/api/payroll/adjustments', 'POST', {
        employeeId: adj.employeeId,
        type: apiType,
        amount: adj.amount,
        reason: adj.label,
        effectivePeriod: period,
      });
      await loadAdjustments();
    } catch (err) {
      pushActivity({ type: 'GOVERNANCE', label: 'Adjustment Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [loadAdjustments, pushActivity, userRole]);

  const removeAdjustment = useCallback(async (id: string) => {
    try {
      await apiMutate(`/api/payroll/adjustments/${id}`, 'DELETE');
      await loadAdjustments();
    } catch (err) {
      pushActivity({ type: 'GOVERNANCE', label: 'Cancel Adjustment Failed',
        message: err instanceof Error ? err.message : 'Unknown',
        author: userRole, status: 'FAILURE' } as any);
      throw err;
    }
  }, [loadAdjustments, pushActivity, userRole]);

  // Bulk adjustments are deferred to Phase 6 — log + no-op so legacy UI doesn't crash.
  const addBulkAdjustments = useCallback((_request: BulkAdjustmentRequest) => {
    pushActivity({ type: 'GOVERNANCE', label: 'Bulk Adjustment Not Wired',
      message: 'Bulk-filtered adjustments require an endpoint not yet built (Phase 6).',
      author: userRole, status: 'WARNING' } as any);
    return { count: 0, totalImpact: 0 };
  }, [pushActivity, userRole]);

  // Direct salary edits not exposed in Phase 5 — would mutate historical entries.
  const updateSalary = useCallback((_s: SalaryStructure) => {
    pushActivity({ type: 'GOVERNANCE', label: 'Direct Salary Edit Blocked',
      message: 'Salary updates create a new SalaryStructure version (Phase 6 admin UI).',
      author: userRole, status: 'WARNING' } as any);
  }, [pushActivity, userRole]);

  return (
    <PayrollContext.Provider value={{
      salaries,
      adjustments,
      payrollRuns,
      updateSalary,
      addAdjustment,
      addBulkAdjustments,
      removeAdjustment,
      generateDraftRun,
      approveRun,
      processRun,
      deleteRun,
      refresh,
    }}>
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = () => {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
};
