"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';
import { useSettings } from './SettingsContext';
import { useWorkforce } from './WorkforceContext';
import { useTeams } from './TeamContext';

export interface CompensationAdjustment {
  id: string;
  employeeId: string;
  type: 'BONUS' | 'DEDUCTION' | 'ALLOWANCE' | 'AWARD' | 'COMPENSATION';
  label: string;
  amount: number;
  period: string; // "May 2026"
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
    hubs?: string[];
    departments?: string[];
    teams?: string[];
    roles?: string[];
    minPerformance?: number;
  }
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
}

interface PayrollContextType {
  salaries: SalaryStructure[];
  adjustments: CompensationAdjustment[];
  payrollRuns: PayrollRun[];
  
  // Mutations
  updateSalary: (salary: SalaryStructure) => void;
  addAdjustment: (adj: Omit<CompensationAdjustment, 'id' | 'createdAt'>) => void;
  addBulkAdjustments: (request: BulkAdjustmentRequest) => { count: number; totalImpact: number };
  removeAdjustment: (id: string) => void;
  
  // Runs
  generateDraftRun: (period: string, hub: string) => void;
  approveRun: (id: string) => void;
  processRun: (id: string) => void;
  deleteRun: (id: string) => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const PayrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [adjustments, setAdjustments] = useState<CompensationAdjustment[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();
  const { settings } = useSettings();
  const { employees } = useWorkforce();
  const { teams } = useTeams();

  useEffect(() => {
    const saved = localStorage.getItem('suler_payroll_v3');
    if (saved) {
      const data = JSON.parse(saved);
      setSalaries(data.salaries || []);
      setAdjustments(data.adjustments || []);
      setPayrollRuns(data.payrollRuns || []);
    } else {
      const initialSalaries: SalaryStructure[] = [
        { id: 'SAL-001', employeeId: 'EMP-001', baseSalary: 450000, housingAllowance: 120000, transportAllowance: 80000, mealAllowance: 40000, otherAllowances: 0, pensionEligible: true, nhfEligible: true, taxStatus: 'PAYE', grade: 'L5', _v: 1 },
        { id: 'SAL-002', employeeId: 'EMP-002', baseSalary: 320000, housingAllowance: 90000, transportAllowance: 60000, mealAllowance: 30000, otherAllowances: 0, pensionEligible: true, nhfEligible: true, taxStatus: 'PAYE', grade: 'L4', _v: 1 }
      ];
      setSalaries(initialSalaries);
      syncState(initialSalaries, [], []);
    }
  }, []);

  const syncState = (s: SalaryStructure[], a: CompensationAdjustment[], r: PayrollRun[]) => {
    localStorage.setItem('suler_payroll_v3', JSON.stringify({ salaries: s, adjustments: a, payrollRuns: r }));
  };

  const updateSalary = (salary: SalaryStructure) => {
    const next = salaries.some(s => s.id === salary.id) 
      ? salaries.map(s => s.id === salary.id ? { ...salary, _v: s._v + 1 } : s)
      : [...salaries, { ...salary, _v: 1 }];
    setSalaries(next);
    syncState(next, adjustments, payrollRuns);
    pushActivity({ type: 'GOVERNANCE', label: 'Compensation Updated', message: `Salary structure for [${salary.employeeId}] adjusted.`, author: userRole, status: 'SUCCESS' } as any);
  };

  const addAdjustment = (adjData: Omit<CompensationAdjustment, 'id' | 'createdAt'>) => {
    const newAdj: CompensationAdjustment = {
      ...adjData,
      id: `ADJ-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    const next = [...adjustments, newAdj];
    setAdjustments(next);
    syncState(salaries, next, payrollRuns);
  };

  const addBulkAdjustments = (req: BulkAdjustmentRequest) => {
    const targetEmployees = employees.filter(emp => {
      if (req.filters.hubs?.length && !req.filters.hubs.includes(emp.hub)) return false;
      if (req.filters.departments?.length && !req.filters.departments.includes(emp.department)) return false;
      if (req.filters.roles?.length && !req.filters.roles.includes(emp.role)) return false;
      
      if (req.filters.teams?.length) {
        const isInTeam = teams.some(t => req.filters.teams?.includes(t.id) && t.members.includes(emp.id));
        if (!isInTeam) return false;
      }
      
      // Performance filter simulation
      if (req.filters.minPerformance && (emp as any).performanceRating < req.filters.minPerformance) return false;
      
      return true;
    });

    let totalImpact = 0;
    const newAdjs: CompensationAdjustment[] = targetEmployees.map(emp => {
      const salary = salaries.find(s => s.employeeId === emp.id);
      let amount = req.amount;
      if (req.amountType === 'PERCENTAGE' && salary) {
        amount = (salary.baseSalary * req.amount) / 100;
      }
      totalImpact += amount;
      return {
        id: `ADJ-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: emp.id,
        type: req.type,
        label: req.title,
        amount,
        period: req.period,
        createdAt: new Date().toISOString()
      };
    });

    const next = [...adjustments, ...newAdjs];
    setAdjustments(next);
    syncState(salaries, next, payrollRuns);
    
    pushActivity({ 
      type: 'GOVERNANCE', 
      label: 'Bulk Adjustment Applied', 
      message: `Applied [${req.title}] to ${targetEmployees.length} employees. Total Impact: ₦${totalImpact.toLocaleString()}`, 
      author: userRole, 
      status: 'SUCCESS' 
    } as any);

    return { count: targetEmployees.length, totalImpact };
  };

  const removeAdjustment = (id: string) => {
    const next = adjustments.filter(a => a.id !== id);
    setAdjustments(next);
    syncState(salaries, next, payrollRuns);
  };

  const calculatePAYE = (taxableIncome: number) => {
    if (taxableIncome <= 0) return 0;
    let tax = 0;
    let remaining = taxableIncome;
    const brackets = [
      { threshold: 25000, rate: 0.07 },
      { threshold: 25000, rate: 0.11 },
      { threshold: 41666, rate: 0.15 },
      { threshold: 41666, rate: 0.19 },
      { threshold: 133333, rate: 0.21 },
      { threshold: Infinity, rate: 0.24 }
    ];
    for (const b of brackets) {
      const amountInBracket = Math.min(remaining, b.threshold);
      tax += amountInBracket * b.rate;
      remaining -= amountInBracket;
      if (remaining <= 0) break;
    }
    return Math.round(tax);
  };

  const generateDraftRun = (period: string, hub: string) => {
    const { compliance } = settings;
    const hubEmployees = employees.filter(e => hub === 'All Regions' || e.hub === hub);
    
    const entries: PayrollEntry[] = hubEmployees.map(emp => {
      const s = salaries.find(sal => sal.employeeId === emp.id) || {
        baseSalary: 100000, housingAllowance: 0, transportAllowance: 0, mealAllowance: 0, otherAllowances: 0,
        pensionEligible: true, nhfEligible: true, taxStatus: 'PAYE'
      } as SalaryStructure;

      const empAdjs = adjustments.filter(a => a.employeeId === emp.id && a.period === period);
      const bonuses = empAdjs.filter(a => ['BONUS', 'AWARD', 'COMPENSATION'].includes(a.type)).reduce((sum, a) => sum + a.amount, 0);
      const totalAllowances = s.housingAllowance + s.transportAllowance + s.mealAllowance + s.otherAllowances + empAdjs.filter(a => a.type === 'ALLOWANCE').reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = empAdjs.filter(a => a.type === 'DEDUCTION').reduce((sum, a) => sum + a.amount, 0);
      
      const grossPay = s.baseSalary + totalAllowances + bonuses;
      const pensionBase = s.baseSalary + s.housingAllowance + s.transportAllowance;
      const pension = s.pensionEligible ? Math.round(pensionBase * compliance.pensionEmployeeRate) : 0;
      const nhf = s.nhfEligible ? Math.round(s.baseSalary * compliance.nhfRate) : 0;
      
      const relief = compliance.taxReliefBase + (grossPay * compliance.taxReliefPercentage);
      const taxableIncome = grossPay - relief - pension - nhf;
      const paye = calculatePAYE(taxableIncome);
      const netPay = grossPay - paye - pension - nhf - totalDeductions;
      
      return {
        id: `ENT-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: emp.id,
        baseSalary: s.baseSalary,
        totalAllowances,
        totalBonuses: bonuses,
        totalDeductions,
        grossPay,
        paye,
        pension,
        nhf,
        netPay,
        period,
        hub: emp.hub
      };
    });

    const newRun: PayrollRun = {
      id: `RUN-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      period,
      entries,
      totalGross: entries.reduce((sum, e) => sum + e.grossPay, 0),
      totalNet: entries.reduce((sum, e) => sum + e.netPay, 0),
      status: 'DRAFT',
      hub,
      createdAt: new Date().toISOString()
    };

    const next = [...payrollRuns, newRun];
    setPayrollRuns(next);
    syncState(salaries, adjustments, next);
  };

  const approveRun = (id: string) => {
    const next = payrollRuns.map(r => r.id === id ? { ...r, status: 'APPROVED' as const, approvedAt: new Date().toISOString() } : r);
    setPayrollRuns(next);
    syncState(salaries, adjustments, next);
  };

  const processRun = (id: string) => {
    const next = payrollRuns.map(r => r.id === id ? { ...r, status: 'PROCESSED' as const } : r);
    setPayrollRuns(next);
    syncState(salaries, adjustments, next);
    pushActivity({ type: 'FINANCE', label: 'Payroll Processed', message: `Payroll run finalized and disbursed.`, author: userRole, status: 'SUCCESS' } as any);
  };

  const deleteRun = (id: string) => {
    const next = payrollRuns.filter(r => r.id !== id);
    setPayrollRuns(next);
    syncState(salaries, adjustments, next);
  };

  return (
    <PayrollContext.Provider value={{ salaries, adjustments, payrollRuns, updateSalary, addAdjustment, addBulkAdjustments, removeAdjustment, generateDraftRun, approveRun, processRun, deleteRun }}>
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
