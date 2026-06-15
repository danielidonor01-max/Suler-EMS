"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Hub {
  id: string;
  name: string;
  geography: string;
  category: string;
  status: 'ACTIVE' | 'INITIALIZING';
  departments: number;
  staff: number;
  manager?: string;
  _v: number;
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

interface OrganizationContextType {
  hubs: Hub[];
  departments: Department[];
  currentHub: string;
  switchHub: (id: string) => void;
  addHub: (hub: Omit<Hub, 'id' | 'status' | 'departments' | 'staff' | '_v'>) => void;
  updateHub: (id: string, updates: Partial<Hub>) => void;
  deleteHub: (id: string) => void;
  addDepartment: (dept: Omit<Department, 'id' | 'staff' | '_v'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  undoMutation: () => void;
  canUndo: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Names align with the seed's Employee.branch values so filters
// (employees/finance/payroll) match. Bump the storage key below if you
// change this list — stale localStorage caches will otherwise keep the
// previous names and break hub-scoped filtering.
const SEEDED_HUBS: Hub[] = [
  { id: 'HUB-00', name: 'All Regions',    geography: 'Global Organization',    category: 'Enterprise View',  status: 'ACTIVE', departments: 3,  staff: 25, _v: 2 },
  { id: 'HUB-01', name: 'Lagos',          geography: 'Nigeria (South-West)',    category: 'Primary HQ',       status: 'ACTIVE', departments: 1,  staff: 14, _v: 2 },
  { id: 'HUB-02', name: 'Abuja',          geography: 'Nigeria (North-Central)', category: 'Regional Ops',     status: 'ACTIVE', departments: 1,  staff: 5,  _v: 2 },
  { id: 'HUB-03', name: 'Port Harcourt',  geography: 'Nigeria (South-South)',   category: 'Logistics Branch', status: 'ACTIVE', departments: 1,  staff: 6,  _v: 2 },
];

// Bumped to wipe pre-fix `Lagos HQ` caches.
const STORAGE_KEYS = {
  hubs: 'suler_hubs_v2',
  depts: 'suler_depts_v2',
  active: 'suler_active_hub_v2',
} as const;

const SEEDED_DEPTS: Department[] = [
  { id: 'DEPT-01', name: 'Executive Management', lead: 'Chinedu Okoro', reportingLine: 'Board', parentHub: 'Lagos HQ', staff: 12, _v: 1 },
  { id: 'DEPT-02', name: 'Human Resources', lead: 'Sarah Williams', reportingLine: 'Executive Office', parentHub: 'Lagos HQ', staff: 24, _v: 1 },
  { id: 'DEPT-03', name: 'Finance & Treasury', lead: 'David Okafor', reportingLine: 'Executive Office', parentHub: 'Lagos HQ', staff: 18, _v: 1 },
  { id: 'DEPT-04', name: 'Clinical Operations', lead: 'Emeka Nwachukwu', reportingLine: 'Operations Directorate', parentHub: 'Benin Branch', staff: 45, _v: 1 },
];

import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  // Default to All Regions so the dashboard shows the full org until the
  // user explicitly narrows scope. This also matches the seed's mix of
  // Lagos / Abuja / Port Harcourt staff — narrowing too early hides data.
  const [currentHub, setCurrentHubState] = useState('All Regions');
  const [history, setHistory] = useState<{hubs: Hub[], depts: Department[]}[]>([]);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const loadOrg = () => {
      const savedHubs = localStorage.getItem(STORAGE_KEYS.hubs);
      const savedDepts = localStorage.getItem(STORAGE_KEYS.depts);
      const savedActive = localStorage.getItem(STORAGE_KEYS.active);

      if (savedHubs) setHubs(JSON.parse(savedHubs));
      else {
        setHubs(SEEDED_HUBS);
        localStorage.setItem(STORAGE_KEYS.hubs, JSON.stringify(SEEDED_HUBS));
      }

      if (savedDepts) setDepartments(JSON.parse(savedDepts));
      else {
        setDepartments(SEEDED_DEPTS);
        localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(SEEDED_DEPTS));
      }

      // Only honor the saved active hub if it resolves to a hub in the
      // current canonical list; otherwise reset to the safe default so a
      // stale `Lagos HQ` cache doesn't strand the user looking at an
      // empty workforce table.
      if (savedActive && SEEDED_HUBS.some(h => h.name === savedActive)) {
        setCurrentHubState(savedActive);
      }

      // Best-effort cleanup of pre-v2 keys (idempotent, swallows missing).
      try {
        localStorage.removeItem('suler_hubs');
        localStorage.removeItem('suler_depts');
        localStorage.removeItem('suler_active_hub');
      } catch { /* private mode etc. */ }
    };

    loadOrg();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.hubs || e.key === STORAGE_KEYS.depts || e.key === STORAGE_KEYS.active) {
        loadOrg();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const switchHub = (id: string) => {
    const hub = hubs.find(h => h.id === id);
    if (hub) {
      setCurrentHubState(hub.name);
      localStorage.setItem(STORAGE_KEYS.active, hub.name);
      
      pushActivity({
        type: 'SYSTEM',
        label: 'Context Switched',
        message: `Operational focus shifted to [${hub.name}]. UI context synchronized.`,
        author: userRole,
        status: 'SUCCESS'
      } as any);
    } else if (id === 'HUB-00') {
      setCurrentHubState('All Regions');
      localStorage.setItem(STORAGE_KEYS.active, 'All Regions');
      
      pushActivity({
        type: 'SYSTEM',
        label: 'Global Context Activated',
        message: 'Enterprise-wide operational view enabled. All regional nodes visible.',
        author: userRole,
        status: 'SUCCESS'
      } as any);
    }
  };

  const syncState = React.useCallback((nextHubs: Hub[], nextDepts: Department[]) => {
    setHistory(prev => [{ hubs, depts: departments }, ...prev].slice(0, 5));
    setHubs(nextHubs);
    setDepartments(nextDepts);
    localStorage.setItem(STORAGE_KEYS.hubs, JSON.stringify(nextHubs));
    localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(nextDepts));
  }, [hubs, departments]);

  const undoMutation = React.useCallback(() => {
    if (history.length > 0) {
      const [prev, ...rest] = history;
      setHubs(prev.hubs);
      setDepartments(prev.depts);
      setHistory(rest);
      localStorage.setItem(STORAGE_KEYS.hubs, JSON.stringify(prev.hubs));
      localStorage.setItem(STORAGE_KEYS.depts, JSON.stringify(prev.depts));
      
      pushActivity({
        type: 'SYSTEM',
        label: 'Topology Mutation Reverted',
        message: 'A recent structural change was undone. Organizational hierarchy restored to previous snapshot.',
        author: userRole,
        status: 'SUCCESS'
      });
    }
  }, [history, userRole, pushActivity]);

  const addHub = React.useCallback((data: Omit<Hub, 'id' | 'status' | 'departments' | 'staff' | '_v'>) => {
    const newHub: Hub = {
      ...data,
      id: `HUB-0${hubs.length + 1}`,
      status: 'ACTIVE',
      departments: 0,
      staff: 0,
      _v: 1
    };
    syncState([...hubs, newHub], departments);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Regional Hub Established',
      message: `New regional node [${data.name}] initialized in ${data.geography}.`,
      author: userRole,
      status: 'SUCCESS',
      hub: data.name,
      version: 1
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  const addDepartment = React.useCallback((data: Omit<Department, 'id' | 'staff' | '_v'>) => {
    const newDept: Department = {
      ...data,
      id: `DEPT-0${departments.length + 1}`,
      staff: 0,
      _v: 1
    };
    const nextDepts = [...departments, newDept];
    const nextHubs = hubs.map(h => h.name === data.parentHub ? { ...h, departments: h.departments + 1, _v: h._v + 1 } : h);
    
    syncState(nextHubs, nextDepts);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Defined',
      message: `Operational unit [${data.name}] established within ${data.parentHub}. Reporting to ${data.reportingLine}.`,
      author: userRole,
      status: 'SUCCESS',
      hub: data.parentHub,
      version: 1
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  const updateHub = React.useCallback((id: string, updates: Partial<Hub>) => {
    const nextHubs = hubs.map(h => h.id === id ? { ...h, ...updates, _v: h._v + 1 } : h);
    syncState(nextHubs, departments);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Hub Identity Mutated',
      message: `Configuration for [${hubs.find(h => h.id === id)?.name}] synchronized by Administrator.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  const deleteHub = React.useCallback((id: string) => {
    const hubToDelete = hubs.find(h => h.id === id);
    if (!hubToDelete) return;

    const nextHubs = hubs.filter(h => h.id !== id);
    const nextDepts = departments.filter(d => d.parentHub !== hubToDelete.name);
    
    syncState(nextHubs, nextDepts);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Regional Hub Dissolved',
      message: `Operational node [${hubToDelete.name}] has been decommissioned. Associated departments archived.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  const updateDepartment = React.useCallback((id: string, updates: Partial<Department>) => {
    const nextDepts = departments.map(d => d.id === id ? { ...d, ...updates, _v: d._v + 1 } : d);
    syncState(hubs, nextDepts);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Departmental Mutation',
      message: `Operational parameters for [${departments.find(d => d.id === id)?.name}] updated.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  const deleteDepartment = React.useCallback((id: string) => {
    const deptToDelete = departments.find(d => d.id === id);
    if (!deptToDelete) return;

    const nextDepts = departments.filter(d => d.id !== id);
    const nextHubs = hubs.map(h => h.name === deptToDelete.parentHub ? { ...h, departments: Math.max(0, h.departments - 1), _v: h._v + 1 } : h);
    
    syncState(nextHubs, nextDepts);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Department Dissolved',
      message: `Operational unit [${deptToDelete.name}] removed from organizational structure.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  }, [hubs, departments, syncState, userRole, pushActivity]);

  return (
    <OrganizationContext.Provider value={{ 
      hubs, 
      departments, 
      currentHub, 
      switchHub, 
      addHub, 
      updateHub,
      deleteHub,
      addDepartment, 
      updateDepartment,
      deleteDepartment,
      undoMutation,
      canUndo: history.length > 0
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization must be used within an OrganizationProvider');
  return context;
};
