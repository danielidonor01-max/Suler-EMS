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
  setCurrentHub: (name: string) => void;
  addHub: (hub: Omit<Hub, 'id' | 'status' | 'departments' | 'staff'>) => void;
  addDepartment: (dept: Omit<Department, 'id' | 'staff'>) => void;
  undoMutation: () => void;
  canUndo: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const SEEDED_HUBS: Hub[] = [
  { id: 'HUB-01', name: 'Lagos HQ', geography: 'Nigeria (South-West)', category: 'Primary HQ', status: 'ACTIVE', departments: 12, staff: 840, _v: 1 },
  { id: 'HUB-02', name: 'Abuja Operations', geography: 'Nigeria (North-Central)', category: 'Regional Operations', status: 'ACTIVE', departments: 8, staff: 320, _v: 1 },
  { id: 'HUB-03', name: 'Benin Branch', geography: 'Nigeria (South-South)', category: 'Satellite Branch', status: 'ACTIVE', departments: 5, staff: 120, _v: 1 },
];

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
  const [currentHub, setCurrentHubState] = useState('Lagos HQ');
  const [history, setHistory] = useState<{hubs: Hub[], depts: Department[]}[]>([]);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const loadOrg = () => {
      const savedHubs = localStorage.getItem('suler_hubs');
      const savedDepts = localStorage.getItem('suler_depts');
      const savedActive = localStorage.getItem('suler_active_hub');
      
      if (savedHubs) setHubs(JSON.parse(savedHubs));
      else {
        setHubs(SEEDED_HUBS);
        localStorage.setItem('suler_hubs', JSON.stringify(SEEDED_HUBS));
      }

      if (savedDepts) setDepartments(JSON.parse(savedDepts));
      else {
        setDepartments(SEEDED_DEPTS);
        localStorage.setItem('suler_depts', JSON.stringify(SEEDED_DEPTS));
      }

      if (savedActive) setCurrentHubState(savedActive);
    };

    loadOrg();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_hubs' || e.key === 'suler_depts' || e.key === 'suler_active_hub') {
        loadOrg();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setCurrentHub = (name: string) => {
    setCurrentHubState(name);
    localStorage.setItem('suler_active_hub', name);
  };

  const syncState = React.useCallback((nextHubs: Hub[], nextDepts: Department[]) => {
    setHistory(prev => [{ hubs, depts: departments }, ...prev].slice(0, 5));
    setHubs(nextHubs);
    setDepartments(nextDepts);
    localStorage.setItem('suler_hubs', JSON.stringify(nextHubs));
    localStorage.setItem('suler_depts', JSON.stringify(nextDepts));
  }, [hubs, departments]);

  const undoMutation = React.useCallback(() => {
    if (history.length > 0) {
      const [prev, ...rest] = history;
      setHubs(prev.hubs);
      setDepartments(prev.depts);
      setHistory(rest);
      localStorage.setItem('suler_hubs', JSON.stringify(prev.hubs));
      localStorage.setItem('suler_depts', JSON.stringify(prev.depts));
      
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

  return (
    <OrganizationContext.Provider value={{ 
      hubs, 
      departments, 
      currentHub, 
      setCurrentHub, 
      addHub, 
      addDepartment, 
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
