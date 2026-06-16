"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import useSWR from 'swr';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

/**
 * Organization state — hubs AND departments now DB-backed.
 *
 * Both pull from SWR-backed endpoints with a 30s polling window so a
 * change made on another device propagates without manual refresh.
 * Mutations call the API and revalidate the cache.
 *
 * What still lives client-side: the "active hub" selection (which hub
 * the current session is filtered to). That's a UI preference, not org
 * structure, and is intentionally per-browser.
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
  departments: number;
  staff: number;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  reportingLine: string | null;
  manager?: { id: string; name: string; jobTitle: string | null } | null;
  managerId?: string | null;
  hub?: { id: string; code: string; name: string } | null;
  hubId?: string | null;
  staff: number;
}

interface NewHubInput {
  code: string;
  name: string;
  geography: string;
  category: string;
  managerId?: string | null;
}

interface NewDepartmentInput {
  code: string;
  name: string;
  reportingLine?: string | null;
  managerId?: string | null;
  hubId?: string | null;
}

interface OrganizationContextType {
  hubs: Hub[];
  hubsLoading: boolean;
  hubsError: Error | undefined;
  departments: Department[];
  departmentsLoading: boolean;
  departmentsError: Error | undefined;
  currentHub: string;
  switchHub: (idOrName: string) => void;
  addHub: (hub: NewHubInput) => Promise<void>;
  updateHub: (id: string, updates: Partial<NewHubInput> & { status?: Hub['status'] }) => Promise<void>;
  deleteHub: (id: string) => Promise<void>;
  addDepartment: (dept: NewDepartmentInput) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<NewDepartmentInput>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ACTIVE_HUB_KEY = 'suler_active_hub_v3';

// ─── Provider ─────────────────────────────────────────────────────────────────

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    data: hubs = [],
    error: hubsError,
    isLoading: hubsLoading,
    mutate: revalidateHubs,
  } = useSWR<Hub[]>('/api/hubs', apiFetcher, { refreshInterval: 30_000 });

  const {
    data: departments = [],
    error: departmentsError,
    isLoading: departmentsLoading,
    mutate: revalidateDepartments,
  } = useSWR<Department[]>('/api/departments', apiFetcher, { refreshInterval: 30_000 });

  const [currentHub, setCurrentHubState] = useState('All Regions');
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  // Hydrate the active hub selection from localStorage. Org data itself
  // comes from SWR — only the per-browser UI focus is cached here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(ACTIVE_HUB_KEY);
      if (saved) setCurrentHubState(saved);
      // Pre-v3 cleanup (idempotent).
      ['suler_hubs', 'suler_depts', 'suler_active_hub',
       'suler_hubs_v2', 'suler_depts_v2', 'suler_active_hub_v2',
       'suler_hubs_v3', 'suler_depts_v3'  // server-of-truth now
      ].forEach(k => localStorage.removeItem(k));
    } catch { /* private mode / quota — fall back to in-memory state */ }
  }, []);

  // ── Hub switcher ──
  const switchHub = useCallback((idOrName: string) => {
    if (idOrName === 'HUB-00' || idOrName === 'All Regions') {
      setCurrentHubState('All Regions');
      try { localStorage.setItem(ACTIVE_HUB_KEY, 'All Regions'); } catch {}
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
    try { localStorage.setItem(ACTIVE_HUB_KEY, hub.name); } catch {}
    pushActivity({
      type: 'SYSTEM',
      label: 'Context Switched',
      message: `Operational focus shifted to [${hub.name}].`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [hubs, pushActivity, userRole]);

  // ── Hub CRUD ──

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
    // Department counts may have changed if the API was permissive — refresh.
    await revalidateDepartments();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Hub Dissolved',
      message: `Hub [${target?.name ?? id}] decommissioned.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [hubs, revalidateHubs, revalidateDepartments, pushActivity, userRole]);

  // ── Department CRUD ──

  const addDepartment = useCallback(async (input: NewDepartmentInput) => {
    await apiMutate('/api/departments', 'POST', input);
    await revalidateDepartments();
    await revalidateHubs(); // department count derived field
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Defined',
      message: `Unit [${input.name}] created.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [revalidateDepartments, revalidateHubs, pushActivity, userRole]);

  const updateDepartment = useCallback(async (id: string, updates: Partial<NewDepartmentInput>) => {
    const target = departments.find(d => d.id === id);
    await apiMutate(`/api/departments/${id}`, 'PATCH', updates);
    await revalidateDepartments();
    if (updates.hubId !== undefined) await revalidateHubs();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Departmental Mutation',
      message: `Parameters for [${target?.name ?? id}] updated.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [departments, revalidateDepartments, revalidateHubs, pushActivity, userRole]);

  const deleteDepartment = useCallback(async (id: string) => {
    const target = departments.find(d => d.id === id);
    await apiMutate(`/api/departments/${id}`, 'DELETE');
    await revalidateDepartments();
    await revalidateHubs();
    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Dissolved',
      message: `Unit [${target?.name ?? id}] removed.`,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  }, [departments, revalidateDepartments, revalidateHubs, pushActivity, userRole]);

  const value = useMemo<OrganizationContextType>(() => ({
    hubs,
    hubsLoading,
    hubsError: hubsError as Error | undefined,
    departments,
    departmentsLoading,
    departmentsError: departmentsError as Error | undefined,
    currentHub,
    switchHub,
    addHub, updateHub, deleteHub,
    addDepartment, updateDepartment, deleteDepartment,
  }), [
    hubs, hubsLoading, hubsError,
    departments, departmentsLoading, departmentsError,
    currentHub, switchHub,
    addHub, updateHub, deleteHub,
    addDepartment, updateDepartment, deleteDepartment,
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
