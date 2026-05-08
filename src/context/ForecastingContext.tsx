"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useWorkforce } from './WorkforceContext';
import { useOrganization } from './OrganizationContext';

export interface StrategicSignal {
  id: string;
  type: 'STRESS' | 'CAPACITY' | 'GROWTH' | 'RISK';
  label: string;
  value: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  insight: string;
}

export interface StaffingProposal {
  id: string;
  employeeId: string;
  employeeName: string;
  sourceHub: string;
  targetHub: string;
  dept: string;
  priority: 'CRITICAL' | 'STAMPED' | 'ROUTINE';
  rationale: string;
}

interface ForecastingContextValue {
  signals: StrategicSignal[];
  proposals: StaffingProposal[];
  stressIndex: number;
  projectedHeadcount: number;
  isCalculating: boolean;
}

const ForecastingContext = createContext<ForecastingContextValue | undefined>(undefined);

export const ForecastingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { employees } = useWorkforce();
  const { hubs, departments } = useOrganization();
  const [isCalculating, setIsCalculating] = useState(false);

  // Deterministic Stress Index Calculation
  const stressIndex = useMemo(() => {
    if (employees.length === 0) return 0;
    // Mock complexity: (Total Staff / Total Departments) * (Pending Count / Active Count)
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    const pending = employees.length - active;
    const deptRatio = employees.length / Math.max(1, departments.length);
    const pendingRatio = (pending + 1) / (active + 1);
    
    return Math.min(100, Math.round(deptRatio * pendingRatio * 15));
  }, [employees, departments]);

  const proposals = useMemo((): StaffingProposal[] => {
    if (stressIndex < 40) return [];

    // Simple deterministic logic: Suggest moving the newest 'PENDING' employees to less stressed hubs
    const candidates = employees.filter(e => e.status === 'PENDING').slice(0, 2);
    
    return candidates.map((emp, idx) => ({
      id: `PROP-0${idx + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      sourceHub: emp.hub,
      targetHub: emp.hub === 'Lagos HQ' ? 'Abuja Operations' : 'Lagos HQ',
      dept: emp.department,
      priority: stressIndex > 70 ? 'CRITICAL' : 'ROUTINE',
      rationale: `Regional density optimization. Relieving ${emp.hub} pressure by 2.4% while addressing ${emp.hub === 'Lagos HQ' ? 'Abuja' : 'Lagos'} shortfall.`
    }));
  }, [employees, stressIndex]);

  const signals = useMemo((): StrategicSignal[] => {
    return [
      {
        id: 'SIG-01',
        type: 'STRESS',
        label: 'Operational Stress',
        value: stressIndex,
        trend: stressIndex > 50 ? 'UP' : 'STABLE',
        insight: stressIndex > 70 
          ? 'Critical workload density detected in Clinical Operations. Immediate resource rebalancing recommended.' 
          : 'Staff-to-department ratios remain within nominal enterprise thresholds.'
      },
      {
        id: 'SIG-02',
        type: 'CAPACITY',
        label: 'Hub Saturation',
        value: 84,
        trend: 'UP',
        insight: 'Lagos HQ is approaching maximum physical and operational capacity. Divert new onboarding to Abuja regional node.'
      },
      {
        id: 'SIG-03',
        type: 'GROWTH',
        label: 'Staffing Velocity',
        value: 12,
        trend: 'STABLE',
        insight: 'Net headcount growth is stable at 12% MoM. Provisioning pipeline is healthy.'
      }
    ];
  }, [stressIndex]);

  return (
    <ForecastingContext.Provider value={{
      signals,
      proposals,
      stressIndex,
      projectedHeadcount: Math.round(employees.length * 1.15), // 15% projected growth
      isCalculating
    }}>
      {children}
    </ForecastingContext.Provider>
  );
};

export const useForecasting = () => {
  const context = useContext(ForecastingContext);
  if (!context) throw new Error('useForecasting must be used within ForecastingProvider');
  return context;
};
