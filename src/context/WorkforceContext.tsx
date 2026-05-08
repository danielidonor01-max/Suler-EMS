"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  office: string;
  department: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  joinedAt: string;
  avatar?: string;
  phone?: string;
  location?: string;
  _v: number; // Version for OCC
}

interface WorkforceContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'status' | 'joinedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  undoMutation: () => void;
  canUndo: boolean;
}

const WorkforceContext = createContext<WorkforceContextType | undefined>(undefined);

const SEEDED_EMPLOYEES: Employee[] = [
  { 
    id: 'EMP-001', 
    name: 'Chinedu Okoro', 
    email: 'superadmin@sulerems.dev', 
    role: 'Super Administrator', 
    office: 'Lagos HQ', 
    department: 'Executive Management', 
    status: 'ACTIVE', 
    joinedAt: '2025-01-10',
    phone: '+234 801 234 5678',
    location: 'Lagos, Nigeria',
    _v: 1
  },
  { 
    id: 'EMP-002', 
    name: 'Sarah Williams', 
    email: 'hr@sulerems.dev', 
    role: 'HR Admin', 
    office: 'Lagos HQ', 
    department: 'Human Resources', 
    status: 'ACTIVE', 
    joinedAt: '2025-03-15',
    phone: '+234 802 345 6789',
    location: 'Lagos, Nigeria',
    _v: 1
  },
  { 
    id: 'EMP-003', 
    name: 'David Okafor', 
    email: 'finance@sulerems.dev', 
    role: 'Finance Admin', 
    office: 'Abuja Operations', 
    department: 'Finance & Treasury', 
    status: 'ACTIVE', 
    joinedAt: '2025-02-20',
    phone: '+234 803 456 7890',
    location: 'Abuja, Nigeria',
    _v: 1
  },
  { 
    id: 'EMP-004', 
    name: 'Emeka Nwachukwu', 
    email: 'manager@sulerems.dev', 
    role: 'Operations Manager', 
    office: 'Benin Branch', 
    department: 'Clinical Operations', 
    status: 'ACTIVE', 
    joinedAt: '2025-04-05',
    phone: '+234 804 567 8901',
    location: 'Benin City, Nigeria',
    _v: 1
  },
  { 
    id: 'EMP-005', 
    name: 'Blessing Adebayo', 
    email: 'employee@sulerems.dev', 
    role: 'Staff Practitioner', 
    office: 'Lagos HQ', 
    department: 'Clinical Operations', 
    status: 'ACTIVE', 
    joinedAt: '2025-05-12',
    phone: '+234 805 678 9012',
    location: 'Lagos, Nigeria',
    _v: 1
  }
];

import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export const WorkforceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<Employee[][]>([]);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const loadWorkforce = () => {
      const saved = localStorage.getItem('suler_workforce');
      if (saved) {
        setEmployees(JSON.parse(saved));
      } else {
        setEmployees(SEEDED_EMPLOYEES);
        localStorage.setItem('suler_workforce', JSON.stringify(SEEDED_EMPLOYEES));
      }
    };

    loadWorkforce();
    
    // Fix: loadWorkforce logic
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_workforce') {
        const saved = localStorage.getItem('suler_workforce');
        if (saved) setEmployees(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync state helper with automatic version increment
  const syncEmployees = (next: Employee[]) => {
    setHistory(prev => [employees, ...prev].slice(0, 5));
    setEmployees(next);
    localStorage.setItem('suler_workforce', JSON.stringify(next));
  };

  const undoMutation = () => {
    if (history.length > 0) {
      const [prev, ...rest] = history;
      setEmployees(prev);
      setHistory(rest);
      localStorage.setItem('suler_workforce', JSON.stringify(prev));
      
      pushActivity({
        type: 'SYSTEM',
        label: 'Mutation Reverted',
        message: 'A recent workforce mutation was undone via the administrative console.',
        author: userRole,
        status: 'SUCCESS'
      });
    }
  };

  const addEmployee = (data: Omit<Employee, 'id' | 'status' | 'joinedAt' | '_v'>) => {
    const newEmp: Employee = {
      ...data,
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      status: 'PENDING',
      joinedAt: new Date().toISOString().split('T')[0],
      _v: 1
    };
    syncEmployees([newEmp, ...employees]);
    
    pushActivity({
      type: 'PROVISIONING',
      label: 'Identity Provisioned',
      message: `New identity [${data.name}] established for ${data.office} / ${data.department}.`,
      author: userRole,
      status: 'SUCCESS',
      hub: data.office,
      version: 1
    } as any);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const emp = employees.find(e => e.id === id);
    const updated = employees.map(e => e.id === id ? { ...e, ...updates, _v: (e._v || 1) + 1 } : e);
    syncEmployees(updated);

    if (emp) {
      pushActivity({
        type: 'GOVERNANCE',
        label: 'Identity Synchronized',
        message: `Identity metadata updated for [${emp.name}]. Changes applied across nodes.`,
        author: userRole,
        status: 'SUCCESS',
        hub: emp.office,
        version: (emp._v || 1) + 1
      } as any);
    }
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    const updated = employees.filter(e => e.id !== id);
    syncEmployees(updated);

    if (emp) {
      pushActivity({
        type: 'SECURITY',
        label: 'Identity Deprovisioned',
        message: `Identity [${emp.name}] revoked and removed from global registry.`,
        author: userRole,
        status: 'SUCCESS',
        hub: emp.office
      });
    }
  };

  return (
    <WorkforceContext.Provider value={{ 
      employees, 
      addEmployee, 
      updateEmployee, 
      deleteEmployee, 
      undoMutation,
      canUndo: history.length > 0
    }}>
      {children}
    </WorkforceContext.Provider>
  );
};

export const useWorkforce = () => {
  const context = useContext(WorkforceContext);
  if (!context) throw new Error('useWorkforce must be used within a WorkforceProvider');
  return context;
};
