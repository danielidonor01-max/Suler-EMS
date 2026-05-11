"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { EmployeeStatus } from '@/config/enums';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  hub: string; // Updated from office for enterprise alignment
  status: string;
  department: string;
  designation: string;
  phone?: string;
  performanceRating?: number; // 1.0 - 5.0
}

interface WorkforceMetrics {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  newHiresThisMonth: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
  details?: string;
}

interface WorkforceContextType {
  employees: Employee[];
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;
  metrics: WorkforceMetrics;
  createEmployee: (employee: Omit<Employee, 'id'>) => { success: boolean; error?: string };
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  suspendEmployee: (id: string) => void;
  assignRole: (id: string, role: string) => void;
  transferEmployee: (id: string, hub: string) => void;
  promoteEmployee: (id: string, newDesignation: string, newRole: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  restoreEmployee: (id: string) => void;
}

const WorkforceContext = createContext<WorkforceContextType | undefined>(undefined);

export const useWorkforce = () => {
  const context = useContext(WorkforceContext);
  if (!context) {
    throw new Error('useWorkforce must be used within a WorkforceProvider');
  }
  return context;
};

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'SUL-001', name: 'Alex Simmons', email: 'alex.s@sulerms.com', role: 'Staff Practitioner', hub: 'Lagos HQ', status: 'ACTIVE', department: 'Engineering', designation: 'Software Engineer', phone: '+234 801 234 5678', performanceRating: 4.8 },
  { id: 'SUL-002', name: 'Rachel Meyer', email: 'r.meyer@sulerms.com', role: 'Operations Manager', hub: 'Abuja Regional', status: 'ACTIVE', department: 'Intelligence', designation: 'Lead Researcher', phone: '+234 802 345 6789', performanceRating: 4.5 },
  { id: 'SUL-003', name: 'James Taggart', email: 'j.taggart@sulerms.com', role: 'Staff Practitioner', hub: 'Port Harcourt', status: 'ACTIVE', department: 'Sales', designation: 'Account Manager', phone: '+234 803 456 7890', performanceRating: 3.9 },
  { id: 'SUL-004', name: 'Linda Blair', email: 'l.blair@sulerms.com', role: 'HR Admin', hub: 'Lagos HQ', status: 'ACTIVE', department: 'Human Resources', designation: 'HR Specialist', phone: '+234 804 567 8901', performanceRating: 4.2 },
  { id: 'SUL-005', name: 'Marcus Johnson', email: 'm.johnson@sulerms.com', role: 'Operations Manager', hub: 'Port Harcourt', status: 'INACTIVE', department: 'Logistics', designation: 'Logistics Coordinator', phone: '+234 805 678 9012', performanceRating: 3.5 },
];

export const WorkforceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `LOG-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, []);

  const createEmployee = useCallback((data: Omit<Employee, 'id'>) => {
    if (employees.some(e => e.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Identity Collision: Email already exists in organization.' };
    }
    const newId = `SUL-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const newEmployee = { ...data, id: newId };
    setEmployees(prev => [...prev, newEmployee]);
    addAuditLog({
      actor: 'Super Admin',
      action: 'MEMBER_ONBOARDED',
      target: data.name,
      status: 'SUCCESS',
      details: `Provisioned as ${data.designation} in ${data.hub}.`
    });
    return { success: true };
  }, [employees, addAuditLog]);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addAuditLog({
      actor: 'Super Admin',
      action: 'IDENTITY_MUTATED',
      target: target.name,
      status: 'SUCCESS',
      details: Object.keys(updates).join(', ') + ' synchronized.'
    });
  }, [employees, addAuditLog]);

  const promoteEmployee = useCallback((id: string, newDesignation: string, newRole: string) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, designation: newDesignation, role: newRole } : e));
    addAuditLog({
      actor: 'Super Admin',
      action: 'RANK_PROMOTION',
      target: target.name,
      status: 'SUCCESS',
      details: `Promoted from ${target.designation} to ${newDesignation} (${newRole}).`
    });
  }, [employees, addAuditLog]);

  const suspendEmployee = useCallback((id: string) => {
    updateEmployee(id, { status: 'INACTIVE' });
  }, [updateEmployee]);

  const assignRole = useCallback((id: string, role: string) => {
    updateEmployee(id, { role });
  }, [updateEmployee]);

  const transferEmployee = useCallback((id: string, hub: string) => {
    updateEmployee(id, { hub });
  }, [updateEmployee]);

  const metrics = useMemo(() => ({
    totalEmployees: employees.length,
    activeCount: employees.filter(e => e.status === 'ACTIVE').length,
    onLeaveCount: employees.filter(e => e.status === 'ON_LEAVE').length,
    newHiresThisMonth: 12,
  }), [employees]);

  const value = {
    employees,
    auditLogs,
    loading,
    error,
    metrics,
    createEmployee,
    updateEmployee,
    suspendEmployee,
    assignRole,
    transferEmployee,
    promoteEmployee,
    addAuditLog,
    restoreEmployee: (id: string) => updateEmployee(id, { status: 'ACTIVE' })
  };

  return (
    <WorkforceContext.Provider value={value}>
      {children}
    </WorkforceContext.Provider>
  );
};
