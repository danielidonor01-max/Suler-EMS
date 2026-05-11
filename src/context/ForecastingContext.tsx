"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ForecastResult {
  metric: string;
  prediction: number;
  confidence: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface ForesightSignal {
  id: string;
  type: 'RISK' | 'OPPORTUNITY' | 'TREND';
  label: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
}

export interface StaffingProposal {
  id: string;
  sourceHub: string;
  targetHub: string;
  employeeId: string;
  employeeName: string;
  rationale: string;
  impactScore: number;
}

interface ForecastingContextType {
  isAnalyzing: boolean;
  forecasts: ForecastResult[];
  signals: ForesightSignal[];
  proposals: StaffingProposal[];
  stressIndex: number;
  runAnalysis: (metric: string) => void;
}

const ForecastingContext = createContext<ForecastingContextType | undefined>(undefined);

export const useForecasting = () => {
  const context = useContext(ForecastingContext);
  if (!context) {
    throw new Error('useForecasting must be used within a ForecastingProvider');
  }
  return context;
};

export const ForecastingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stressIndex, setStressIndex] = useState(42); // Default moderate stress

  const [forecasts] = useState<ForecastResult[]>([
    { metric: 'Workforce Attrition', prediction: 2.4, confidence: 0.88, trend: 'DOWN' },
    { metric: 'Operational Load', prediction: 78.5, confidence: 0.92, trend: 'UP' },
  ]);

  const [signals] = useState<ForesightSignal[]>([
    {
      id: 'FS-01',
      type: 'RISK',
      label: 'Workforce Strain',
      message: 'Operational load index trending upward. Resource allocation review recommended.',
      severity: 'MEDIUM',
      timestamp: Date.now(),
    },
  ]);

  const [proposals] = useState<StaffingProposal[]>([
    {
      id: 'PROP-2049A',
      sourceHub: 'Lagos HQ',
      targetHub: 'Abuja Regional',
      employeeId: 'SUL-002',
      employeeName: 'Sarah Williams',
      rationale: 'High operational deficit in Abuja matched with excess capacity in Lagos HQ.',
      impactScore: 92
    }
  ]);

  // Simulate a slowly drifting stress index
  useEffect(() => {
    const interval = setInterval(() => {
      setStressIndex(prev => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(10, Math.min(95, parseFloat((prev + delta).toFixed(1))));
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const runAnalysis = useCallback((metric: string) => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  }, []);

  return (
    <ForecastingContext.Provider value={{ isAnalyzing, forecasts, signals, proposals, stressIndex, runAnalysis }}>
      {children}
    </ForecastingContext.Provider>
  );
};
