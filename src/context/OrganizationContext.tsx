"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import useSWR from 'swr';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

/**
 * Organization state.
 *
 * Hubs — DB-backed via /api/hubs (Phase 2 of org-persistence). The list
 *        is the authoritative source for the header switcher, the org
 *        chart, and hub filters across the workforce / payroll / finance
 *        pages. SWR caches with a 30s revalidation window so additions in
 *        another tab / device propagate without manual refresh.
 *
 * Departments — still localStorage for now. The DB has 3 departments
 *               (Lagos HQ / Abuja Ops / PHC Logistics) wired to hubs via
 *               the new hubId FK; the rich client-side shape with
 *               reportingLine + lead + parentHub + counts is a UI-only
 *               concern that doesn't have an API match yet. Phase 3 of
 *               org-persistence will migrate departments next.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Hub {
  id: string;
  code: string;
  name: string;
  geography: string;
  category: string;
  status: 'ACTIVE' | 'INITIALIZING' | 'INACTIVE';
  manager?: { id: string; name: string; jobTitle: string | null } | null;
  managerId?: string | null;
  departments: number; // derived count from the API
  staff: number;       // derived count from the API
}

export interface Department {
  id: string;
  name: string;
  lead: string;
  reportingLine: string;
  parentHub: string;
  staff: number;
  _v: number;
}

interface NewHubInput {
  code: string;
  name: string;
  geography: string;
  category: string;
  managerId?: string | null;
}

interface OrganizationContextType {
  hubs: Hub[];
  hubsLoading: boolean;
  hubsError: Error | undefined;
  departments: Department[];
  currentHub: string;
  switchHub: (idOrName: string) => void;
  addHub: (hub: NewHubInput) => Promise<void>;
  updateHub: (id: string, updates: Partial<NewHubInput> & { status?: Hub['status'] }) => Promise<void>;
  deleteHub: (id: string) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id' | 'staff' | '_v'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  undoMutation: () => void;
  canUndo: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// ─── Departments seed (localStorage only — to migrate in Phase 3) ─────────────

const STORAGE_KEYS = {
  depts:  'suler_depts_v3',
  active: 'suler_active_hub_v3',
} as const;

const SEEDED_DEPTS: Department[] = [
  { id: 'DEPT-01', name: 'Executive Office',  lead: 'Olumide Adeyemi', reportingLine: 'Board',              parentHub: 'Lagos',         staff: 1,  _v: 2 },
  { id: 'DEPT-02', name: 'Human Resources',   lead: 'Chiamaka Obi',    reportingLine: 'Executive Office',   parentHub: 'Lagos',         staff: 2,  _v: 2 },
  { id: 'DEPT-03', name: 'Finance & Treasury',lead: 'Adaeze Nnamdi',   reportingLine: 'Executive Office',   parentHub: 'Abuja',         staff: 3,  _v: 2 },
  { id: 'DEPT-04', name: 'Operations',        lead: 'Ibrahim Yusuf',   reportingLine: 'Executive Office',   parentHub: 'Lagos',         staff: 13, _v: 2 },
  { id: 'DEPT-05', name: 'Logistics',         lead: 'Tunde Bakare',    reportingLine: 'Operations',         parentHub: 'Port Harcourt', staff: 6,  _v: 2 },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Hubs come from the server. SWR caches, polls every 30s, revalidates on
  // window focus. Mutations call the API then refresh the cache.
  const {
    data: hubs = [],
    error: hubsError,
    isLoading: hubsLoading,
    mutate: revalidateHubs,
  } = useSWR<Hub[]>('/api/hubs', apiFetcher, { refreshInterval: 30_000 });

  // Departments still localStorage-backed until Phase 3.
  const [departments, setDepartments] = useState<Department[]>([]);
  const [history, setHistory] = useState<Department[][]>([]);
  const [currentHub, setCurrentHubState] = useState('All Regions');
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  // Hydrate departments + active hub from localStorage once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDepts = localStorage.getItem(STORAGE_KEYS.depts);
      if (savedDepts) setDepartments(JSON.parse(savedDepts));
      else {
        setDepartments(SEEDED_DEPTS);
        localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(SEEDED_DEPTS));
      }

      const savedActive = localStorage.getItem(STORAGE_KEYS.active);
      if (savedActive) setCurrentHubState(savedActive);

      // Pre-v3 cleanup (idempotent).
      ['suler_hubs', 'suler_depts', 'suler_active_hub',
       'suler_hubs_v2', 'suler_depts_v2', 'suler_active_hub_v2',
       'suler_hubs_v3'  // stale v3 hubs cache — server is source of truth now
      ].forEach(k => localStorage.removeItem(k));
    } catch { /* private mode / quota — fall back to in-memory state */ }
  }, []);

  // ── Hub switcher ──
  // Accepts either an id ("HUB-01" / uuid) or a name ("Lagos"). The
  // special id "HUB-00" toggles to the "All Regions" enterprise view.
  const switchHub = useCallback((idOrName: string) => {
    if (idOrName === 'HUB-00' || idOrName === 'All Regions') {
      setCurrentHubState('All Regions');
      try { localStorage.setItem(STORAGE_KEYS.active, 'All Regions'); } catch {}
      pushActivity({
        type: 'SYSTEM',
        label: 'Global Context Activated',
        message: 'Enterprise-wide view enabled. All regional nodes visible.',
        author: userRole,
        status: 'SUCCESS',
      } as any);
      return;
    }
    const hub = hubs.find(h => h.id === idOrName || h.code === idOrName || h.name === idOrName);
    if (!hub) return;
    setCurrentHubState(hub.name);
    try { localStorage.setItem(STORAGE_KEYS.active, hub.name); } catch {}
    pushActivity({
      type: 'SYSTEM',
      label: 'Context Switched',
      message: `Operational focus shifted to [${hub.name}].`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [hubs, pushActivity, userRole]);

  // ── Hub CRUD (server-backed) ──

  const addHub = useCallback(async (input: NewHubInput) => {
    await apiMutate('/api/hubs', 'POST', input);
    await revalidateHubs();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Regional Hub Established',
      message: `New hub [${input.name}] initialized in ${input.geography}.`,
      author: userRole,
      status: 'SUCCESS',
      hub: input.name,
    } as any);
  }, [revalidateHubs, pushActivity, userRole]);

  const updateHub = useCallback(async (id: string, updates: Partial<NewHubInput> & { status?: Hub['status'] }) => {
    const target = hubs.find(h => h.id === id);
    await apiMutate(`/api/hubs/${id}`, 'PATCH', updates);
    await revalidateHubs();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Hub Identity Updated',
      message: `Configuration for [${target?.name ?? id}] synchronized.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [hubs, revalidateHubs, pushActivity, userRole]);

  const deleteHub = useCallback(async (id: string) => {
    const target = hubs.find(h => h.id === id);
    await apiMutate(`/api/hubs/${id}`, 'DELETE');
    await revalidateHubs();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Hub Dissolved',
      message: `Hub [${target?.name ?? id}] decommissioned.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [hubs, revalidateHubs, pushActivity, userRole]);

  // ── Department CRUD (localStorage only for now) ──

  const syncDepts = useCallback((next: Department[]) => {
    setHistory(prev => [departments, ...prev].slice(0, 5));
    setDepartments(next);
    try { localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(next)); } catch {}
  }, [departments]);

  const addDepartment = useCallback((data: Omit<Department, 'id' | 'staff' | '_v'>) => {
    const newDept: Department = { ...data, id: `DEPT-0${departments.length + 1}`, staff: 0, _v: 1 };
    syncDepts([...departments, newDept]);
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Defined',
      message: `Unit [${data.name}] established within ${data.parentHub}.`,
      author: userRole,
      status: 'SUCCESS',
      hub: data.parentHub,
    } as any);
  }, [departments, syncDepts, pushActivity, userRole]);

  const updateDepartment = useCallback((id: string, updates: Partial<Department>) => {
    const next = departments.map(d => d.id === id ? { ...d, ...updates, _v: d._v + 1 } : d);
    syncDepts(next);
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Departmental Mutation',
      message: `Parameters for [${departments.find(d => d.id === id)?.name}] updated.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [departments, syncDepts, pushActivity, userRole]);

  const deleteDepartment = useCallback((id: string) => {
    const target = departments.find(d => d.id === id);
    if (!target) return;
    syncDepts(departments.filter(d => d.id !== id));
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Dissolved',
      message: `Unit [${target.name}] removed.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [departments, syncDepts, pushActivity, userRole]);

  const undoMutation = useCallback(() => {
    if (history.length === 0) return;
    const [prev, ...rest] = history;
    setDepartments(prev);
    setHistory(rest);
    try { localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(prev)); } catch {}
    pushActivity({
      type: 'SYSTEM',
      label: 'Topology Reverted',
      message: 'Departmental change undone.',
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [history, pushActivity, userRole]);

  const value = useMemo<OrganizationContextType>(() => ({
    hubs,
    hubsLoading,
    hubsError: hubsError as Error | undefined,
    departments,
    currentHub,
    switchHub,
    addHub, updateHub, deleteHub,
    addDepartment, updateDepartment, deleteDepartment,
    undoMutation,
    canUndo: history.length > 0,
  }), [
    hubs, hubsLoading, hubsError, departments, currentHub,
    switchHub, addHub, updateHub, deleteHub,
    addDepartment, updateDepartment, deleteDepartment,
    undoMutation, history.length,
  ]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within an OrganizationProvider');
  return ctx;
};
