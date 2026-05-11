"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface Budget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  hub: string;
  department: string;
  year: number;
  status: 'ACTIVE' | 'DEPLETED' | 'EXCEEDED';
}

export interface Expenditure {
  id: string;
  description: string;
  amount: number;
  category: 'OPEX' | 'CAPEX' | 'PROCUREMENT' | 'PETTY_CASH';
  hub: string;
  department: string;
  requestedBy: string; // Employee ID
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
  _v: number;
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
  
  // Mutations
  addExpenditure: (exp: Omit<Expenditure, 'id' | 'status' | 'createdAt' | '_v'>) => void;
  approveExpenditure: (id: string) => void;
  payExpenditure: (id: string) => void;
  allocateProjectFunds: (proj: Omit<ProjectFunding, 'id' | 'status'>) => void;
  updateBudget: (id: string, spent: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const SEEDED_BUDGETS: Budget[] = [
  { id: 'B-01', name: 'Lagos Ops Budget 2026', allocated: 50000000, spent: 12500000, hub: 'Lagos HQ', department: 'Operations', year: 2026, status: 'ACTIVE' },
  { id: 'B-02', name: 'Abuja HR Budget 2026', allocated: 15000000, spent: 2000000, hub: 'Abuja Hub', department: 'Human Resources', year: 2026, status: 'ACTIVE' }
];

const SEEDED_EXPENDITURES: Expenditure[] = [
  { id: 'EXP-001', description: 'Office Equipment Procurement', amount: 4500000, category: 'CAPEX', hub: 'Lagos HQ', department: 'Operations', requestedBy: 'EMP-001', status: 'PAID', createdAt: new Date().toISOString(), _v: 1 },
  { id: 'EXP-002', description: 'Regional Staff Travel', amount: 250000, category: 'OPEX', hub: 'Abuja Hub', department: 'Human Resources', requestedBy: 'EMP-003', status: 'PENDING', createdAt: new Date().toISOString(), _v: 1 }
];

const SEEDED_PROJECTS: ProjectFunding[] = [
  { id: 'PROJ-01', projectName: 'Port Harcourt Branch Expansion', allocation: 120000000, utilized: 45000000, hub: 'Lagos HQ', status: 'FUNDED' }
];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [projects, setProjects] = useState<ProjectFunding[]>([]);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const savedFinance = localStorage.getItem('suler_finance');
    if (savedFinance) {
      const data = JSON.parse(savedFinance);
      setBudgets(data.budgets);
      setExpenditures(data.expenditures);
      setProjects(data.projects);
    } else {
      setBudgets(SEEDED_BUDGETS);
      setExpenditures(SEEDED_EXPENDITURES);
      setProjects(SEEDED_PROJECTS);
      syncState(SEEDED_BUDGETS, SEEDED_EXPENDITURES, SEEDED_PROJECTS);
    }
  }, []);

  const syncState = (b: Budget[], e: Expenditure[], p: ProjectFunding[]) => {
    localStorage.setItem('suler_finance', JSON.stringify({ budgets: b, expenditures: e, projects: p }));
  };

  const addExpenditure = (expData: Omit<Expenditure, 'id' | 'status' | 'createdAt' | '_v'>) => {
    const newExp: Expenditure = {
      ...expData,
      id: `EXP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      _v: 1
    };
    const nextExp = [...expenditures, newExp];
    setExpenditures(nextExp);
    syncState(budgets, nextExp, projects);

    pushActivity({
      type: 'FINANCE',
      label: 'Expenditure Request Initialized',
      message: `Request for [${newExp.description}] (₦${newExp.amount.toLocaleString()}) submitted for ${newExp.hub}.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const approveExpenditure = (id: string) => {
    const nextExp = expenditures.map(e => e.id === id ? { ...e, status: 'APPROVED' as const, _v: e._v + 1 } : e);
    setExpenditures(nextExp);
    syncState(budgets, nextExp, projects);

    const exp = expenditures.find(e => e.id === id);
    pushActivity({
      type: 'FINANCE',
      label: 'Expenditure Authorized',
      message: `Expenditure [${exp?.description}] has been approved for payment.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const payExpenditure = (id: string) => {
    const exp = expenditures.find(e => e.id === id);
    if (!exp) return;

    const nextExp = expenditures.map(e => e.id === id ? { ...e, status: 'PAID' as const, _v: e._v + 1 } : e);
    setExpenditures(nextExp);
    
    // Auto-update budget spent
    const budget = budgets.find(b => b.hub === exp.hub && b.department === exp.department);
    let nextBudgets = budgets;
    if (budget) {
      nextBudgets = budgets.map(b => b.id === budget.id ? { ...b, spent: b.spent + exp.amount } : b);
      setBudgets(nextBudgets);
    }

    syncState(nextBudgets, nextExp, projects);

    pushActivity({
      type: 'FINANCE',
      label: 'Financial Disbursement',
      message: `Payment of ₦${exp.amount.toLocaleString()} for [${exp.description}] completed.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const allocateProjectFunds = (projData: Omit<ProjectFunding, 'id' | 'status'>) => {
    const newProj: ProjectFunding = {
      ...projData,
      id: `PROJ-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: 'FUNDED'
    };
    const nextProjects = [...projects, newProj];
    setProjects(nextProjects);
    syncState(budgets, expenditures, nextProjects);

    pushActivity({
      type: 'FINANCE',
      label: 'Project Funding Allocated',
      message: `Initiative [${newProj.projectName}] funded with ₦${newProj.allocation.toLocaleString()}.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const updateBudget = (id: string, spent: number) => {
    const nextBudgets = budgets.map(b => b.id === id ? { ...b, spent } : b);
    setBudgets(nextBudgets);
    syncState(nextBudgets, expenditures, projects);
  };

  return (
    <FinanceContext.Provider value={{ 
      budgets, 
      expenditures, 
      projects, 
      addExpenditure, 
      approveExpenditure, 
      payExpenditure, 
      allocateProjectFunds,
      updateBudget
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
