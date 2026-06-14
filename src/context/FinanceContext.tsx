"use client";

/**
 * FinanceContext (v3 — API-backed)
 *
 * Surface compatibility: the legacy `Budget` / `Expenditure` / `ProjectFunding`
 * types are preserved so the existing finance page renders without code
 * changes. Internally the data comes from `/api/finance/*` and every mutation
 * routes through the ExpenditureService → WorkflowEngine.
 *
 * Status mapping (API ↔ legacy):
 *   SUBMITTED ↔ PENDING
 *   APPROVED  ↔ APPROVED
 *   DISBURSED ↔ PAID
 *   REJECTED  ↔ REJECTED
 *   CANCELLED ↔ REJECTED (collapsed for display)
 *
 * `projects` (ProjectFunding) has no backend yet — kept as an empty array so
 * page imports don't break. Project funding will land in a later phase.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

// ─── Legacy public types (preserved for existing pages) ─────────────────────
export interface Budget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  hub: string;
  department: string;
  year: number;
  status: 'ACTIVE' | 'DEPLETED' | 'EXCEEDED';
  /** new — exposed for new modal to pick budget */
  remaining: number;
  /** new — exposed for new modal to pick category */
  categories?: Array<{ id: string; name: string; code: string | null; remaining: number }>;
}

export interface Expenditure {
  id: string;
  description: string;
  amount: number;
  category: string;
  hub: string;
  department: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
  _v: number;
  /** new — used by approval queue */
  vendor?: string;
}

export interface ProjectFunding {
  id: string;
  projectName: string;
  allocation: number;
  utilized: number;
  hub: string;
  status: 'FUNDED' | 'UNDERFUNDED' | 'COMPLETED';
}

interface FinanceContextType {
  budgets: Budget[];
  expenditures: Expenditure[];
  projects: ProjectFunding[];
  // Mutations (legacy shape — async under the hood)
  addExpenditure: (exp: Omit<Expenditure, 'id' | 'status' | 'createdAt' | '_v'>) => Promise<void>;
  /** New full-shape submission method (preferred — uses real budget + category ids) */
  submitExpenditureV2: (input: { budgetId: string; categoryId?: string | null; amount: number; description: string; vendor?: string }) => Promise<void>;
  approveExpenditure: (id: string) => Promise<void>;
  rejectExpenditure: (id: string, reason?: string) => Promise<void>;
  payExpenditure: (id: string) => Promise<void>;
  allocateProjectFunds: (proj: Omit<ProjectFunding, 'id' | 'status'>) => void;
  updateBudget: (id: string, spent: number) => void;
  refresh: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const BUDGET_POLL_MS = 30_000;
const EXP_POLL_MS = 15_000;

// ─── API → legacy mapping ───────────────────────────────────────────────────
interface ApiBudget {
  id: string; name: string;
  totalAmount: string | number;
  allocatedAmount: string | number;
  spentAmount: string | number;
  status: string;
  fiscalYear: string;
  department?: { id: string; name: string; code: string } | null;
  categories?: Array<{ id: string; name: string; code: string | null; allocatedAmount: string | number; spentAmount: string | number }>;
  utilization?: { totalAmount: number; spentAmount: number; remainingAmount: number; utilizationPercent: number };
}

interface ApiExpenditure {
  id: string; description: string; amount: string | number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CANCELLED';
  createdAt: string; vendor?: string | null;
  budget?: { id: string; name: string };
  category?: { id: string; name: string; code: string | null } | null;
  requestedBy?: { id: string; firstName: string; lastName: string; jobTitle?: string };
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function mapBudget(b: ApiBudget): Budget {
  const allocated = num(b.totalAmount);
  const spent = num(b.spentAmount);
  const remaining = allocated - spent;
  const yearMatch = (b.fiscalYear ?? '').match(/\d{4}/);
  return {
    id: b.id,
    name: b.name,
    allocated,
    spent,
    hub: b.department?.code ?? 'GLOBAL',
    department: b.department?.name ?? 'Organization-wide',
    year: yearMatch ? Number(yearMatch[0]) : new Date().getFullYear(),
    status: remaining <= 0 ? 'DEPLETED' : b.status === 'CLOSED' ? 'DEPLETED' : 'ACTIVE',
    remaining,
    categories: b.categories?.map(c => ({
      id: c.id, name: c.name, code: c.code,
      remaining: num(c.allocatedAmount) - num(c.spentAmount),
    })),
  };
}

function mapExpenditure(e: ApiExpenditure): Expenditure {
  const legacyStatus: Expenditure['status'] =
    e.status === 'DISBURSED' ? 'PAID'
    : e.status === 'APPROVED' ? 'APPROVED'
    : e.status === 'REJECTED' || e.status === 'CANCELLED' ? 'REJECTED'
    : 'PENDING';
  return {
    id: e.id,
    description: e.description,
    amount: num(e.amount),
    category: e.category?.name ?? 'OPEX',
    hub: e.budget?.name?.split('—')[0]?.trim() ?? 'GLOBAL',
    department: e.budget?.name ?? '—',
    requestedBy: e.requestedBy?.id ?? '',
    status: legacyStatus,
    createdAt: e.createdAt,
    _v: 1,
    vendor: e.vendor ?? undefined,
  };
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAccess();
  const { pushActivity } = useActivity();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [projects] = useState<ProjectFunding[]>([]); // backend not wired
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const loadBudgets = useCallback(async () => {
    try {
      const data = await apiFetcher<ApiBudget[]>('/api/finance/budgets?status=ACTIVE&includeUtilization=true');
      // Categories aren't included in the list endpoint; fetch one-by-one only
      // when the UI needs them (the new submission modal will). For now the
      // list view doesn't need categories.
      setBudgets(data.map(mapBudget));
    } catch { /* silent — UI shows empty */ }
  }, []);

  const loadExpenditures = useCallback(async () => {
    if (!user) return;
    try {
      // Finance / Super Admin see the team queue + their own. Others see their own.
      const isFinance = ['FINANCE_MANAGER', 'SUPER_ADMIN'].includes(user.role);
      const url = isFinance ? '/api/finance/expenditures?scope=team' : '/api/finance/expenditures?scope=mine';
      const data = await apiFetcher<ApiExpenditure[]>(url);
      setExpenditures(data.map(mapExpenditure));
    } catch { /* silent */ }
  }, [user]);

  // Initial load + polling
  useEffect(() => {
    if (!user) return;
    loadBudgets();
    const t = setInterval(loadBudgets, BUDGET_POLL_MS);
    return () => clearInterval(t);
  }, [user, loadBudgets]);

  useEffect(() => {
    if (!user) return;
    loadExpenditures();
    const t = setInterval(loadExpenditures, EXP_POLL_MS);
    return () => clearInterval(t);
  }, [user, loadExpenditures]);

  const refresh = useCallback(async () => {
    await Promise.all([loadBudgets(), loadExpenditures()]);
  }, [loadBudgets, loadExpenditures]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const submitExpenditureV2 = useCallback(async (input: { budgetId: string; categoryId?: string | null; amount: number; description: string; vendor?: string }) => {
    try {
      await apiMutate('/api/finance/expenditures', 'POST', input);
      await loadExpenditures();
      pushActivity({
        type: 'FINANCE',
        label: 'Expenditure Submitted',
        message: `[${input.description}] (${formatCurrency(input.amount)}) submitted for approval.`,
        author: userRole,
        status: 'SUCCESS',
      } as any);
    } catch (err) {
      pushActivity({
        type: 'FINANCE',
        label: 'Expenditure Submission Failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        author: userRole,
        status: 'FAILURE',
      } as any);
      throw err;
    }
  }, [loadExpenditures, pushActivity, userRole]);

  /**
   * Legacy shim: derive budget from hub/department + amount; falls back to the
   * first ACTIVE budget. Real flow should use submitExpenditureV2.
   */
  const addExpenditure = useCallback(async (expData: Omit<Expenditure, 'id' | 'status' | 'createdAt' | '_v'>) => {
    const matchingBudget =
      budgets.find(b => b.hub === expData.hub) ??
      budgets.find(b => b.department.toLowerCase().includes(expData.department.toLowerCase())) ??
      budgets[0];
    if (!matchingBudget) {
      pushActivity({
        type: 'FINANCE',
        label: 'No Active Budget',
        message: 'Cannot submit expenditure — no ACTIVE budget exists. Ask Finance to create one.',
        author: userRole,
        status: 'FAILURE',
      } as any);
      throw new Error('No active budget available');
    }
    await submitExpenditureV2({
      budgetId: matchingBudget.id,
      amount: expData.amount,
      description: expData.description,
    });
  }, [budgets, submitExpenditureV2, pushActivity, userRole]);

  const transitionExpenditureLegacy = useCallback(async (id: string, action: 'APPROVE_FINANCE' | 'REJECT_FINANCE' | 'DISBURSE', comment?: string) => {
    try {
      await apiMutate(`/api/finance/expenditures/${id}/transition`, 'PATCH', { action, comment });
      await Promise.all([loadExpenditures(), loadBudgets()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transition failed';
      pushActivity({
        type: 'FINANCE',
        label: 'Expenditure Action Failed',
        message: msg,
        author: userRole,
        status: 'FAILURE',
      } as any);
      throw err;
    }
  }, [loadExpenditures, loadBudgets, pushActivity, userRole]);

  const approveExpenditure = useCallback((id: string) => transitionExpenditureLegacy(id, 'APPROVE_FINANCE'), [transitionExpenditureLegacy]);
  const rejectExpenditure = useCallback((id: string, reason?: string) =>
    transitionExpenditureLegacy(id, 'REJECT_FINANCE', reason ?? 'No reason provided'),
  [transitionExpenditureLegacy]);
  const payExpenditure = useCallback((id: string) => transitionExpenditureLegacy(id, 'DISBURSE'), [transitionExpenditureLegacy]);

  // Project funding has no backend yet — preserve the activity log for UI.
  const allocateProjectFunds = useCallback((projData: Omit<ProjectFunding, 'id' | 'status'>) => {
    pushActivity({
      type: 'FINANCE',
      label: 'Project Funding Requested',
      message: `Project funding for [${projData.projectName}] (${formatCurrency(projData.allocation)}) — backend not yet wired.`,
      author: userRole,
      status: 'WARNING',
    } as any);
  }, [pushActivity, userRole]);

  const updateBudget = useCallback((_id: string, _spent: number) => {
    pushActivity({
      type: 'FINANCE',
      label: 'Direct Budget Edit Blocked',
      message: 'Budgets are updated automatically by disbursements. Direct edits are not supported.',
      author: userRole,
      status: 'WARNING',
    } as any);
  }, [pushActivity, userRole]);

  return (
    <FinanceContext.Provider value={{
      budgets,
      expenditures,
      projects,
      addExpenditure,
      submitExpenditureV2,
      approveExpenditure,
      rejectExpenditure,
      payExpenditure,
      allocateProjectFunds,
      updateBudget,
      refresh,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
