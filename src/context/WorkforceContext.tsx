"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { EmployeeStatus } from '@/config/enums';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  office: string;
  status: string;
  department?: string;
  designation?: string;
  phone?: string;
}

interface WorkforceMetrics {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  newHiresThisMonth: number;
}

interface WorkforceContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  metrics: WorkforceMetrics;
  createEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  suspendEmployee: (id: string) => void;
  assignRole: (id: string, role: string) => void;
  transferEmployee: (id: string, office: string) => void;
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

// Initial Mock Data
const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'SUL-001', name: 'Alex Simmons', email: 'alex.s@sulerms.com', role: 'Staff Practitioner', office: 'Lagos HQ', status: 'ACTIVE', department: 'Engineering', designation: 'Software Engineer', phone: '+234 801 234 5678' },
  { id: 'SUL-002', name: 'Rachel Meyer', email: 'r.meyer@sulerms.com', role: 'Operations Manager', office: 'Abuja Operations', status: 'ACTIVE', department: 'Intelligence', designation: 'Lead Researcher', phone: '+234 802 345 6789' },
  { id: 'SUL-003', name: 'James Taggart', email: 'j.taggart@sulerms.com', role: 'Staff Practitioner', office: 'Benin Branch', status: 'ACTIVE', department: 'Sales', designation: 'Account Manager', phone: '+234 803 456 7890' },
  { id: 'SUL-004', name: 'Linda Blair', email: 'l.blair@sulerms.com', role: 'HR Admin', office: 'Lagos HQ', status: 'ACTIVE', department: 'Human Resources', designation: 'HR Specialist', phone: '+234 804 567 8901' },
  { id: 'SUL-005', name: 'Marcus Johnson', email: 'm.johnson@sulerms.com', role: 'Operations Manager', office: 'Port Harcourt', status: 'INACTIVE', department: 'Logistics', designation: 'Logistics Coordinator', phone: '+234 805 678 9012' },
];

export const WorkforceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => ({
    totalEmployees: employees.length,
    activeCount: employees.filter(e => e.status === 'ACTIVE').length,
    onLeaveCount: employees.filter(e => e.status === 'ON_LEAVE').length,
    newHiresThisMonth: 12, // Mocked for now
  }), [employees]);

  const createEmployee = useCallback((data: Omit<Employee, 'id'>) => {
    const newEmployee = { ...data, id: `EMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` };
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const suspendEmployee = useCallback((id: string) => {
    updateEmployee(id, { status: 'INACTIVE' });
  }, [updateEmployee]);

  const assignRole = useCallback((id: string, role: string) => {
    updateEmployee(id, { role });
  }, [updateEmployee]);

  const transferEmployee = useCallback((id: string, office: string) => {
    updateEmployee(id, { office });
  }, [updateEmployee]);

  const restoreEmployee = useCallback((id: string) => {
    updateEmployee(id, { status: 'ACTIVE' });
  }, [updateEmployee]);

  const value = {
    employees,
    loading,
    error,
    metrics,
    createEmployee,
    updateEmployee,
    suspendEmployee,
    assignRole,
    transferEmployee,
    restoreEmployee
  };

  return (
    <WorkforceContext.Provider value={value}>
      {children}
    </WorkforceContext.Provider>
  );
};
