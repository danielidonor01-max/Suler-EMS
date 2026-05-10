"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CompliancePolicy {
  pensionEmployeeRate: number;
  pensionEmployerRate: number;
  nhfRate: number;
  nsitfRate: number;
  taxReliefBase: number;
  taxReliefPercentage: number;
  itfContributionRate: number;
  groupLifeRate: number;
}

export interface SalaryBand {
  id: string;
  level: string;
  minSalary: number;
  maxSalary: number;
  stepIncrement: number;
}

interface Settings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    criticalOnly: boolean;
  };
  workspace: {
    compactMode: boolean;
    sidebarCollapsed: boolean;
    defaultHub: string;
  };
  governance: {
    auditLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    enforceMFA: boolean;
  };
  compliance: CompliancePolicy;
  salaryBands: SalaryBand[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  resetSettings: () => void;
}

const DEFAULT_COMPLIANCE: CompliancePolicy = {
  pensionEmployeeRate: 0.08,
  pensionEmployerRate: 0.10,
  nhfRate: 0.025,
  nsitfRate: 0.01,
  taxReliefBase: 200000,
  taxReliefPercentage: 0.20,
  itfContributionRate: 0.01,
  groupLifeRate: 0.005
};

const DEFAULT_BANDS: SalaryBand[] = [
  { id: 'B1', level: 'Level 10 (Director)', minSalary: 1200000, maxSalary: 1800000, stepIncrement: 50000 },
  { id: 'B2', level: 'Level 8 (Manager)', minSalary: 750000, maxSalary: 950000, stepIncrement: 30000 },
  { id: 'B3', level: 'Level 5 (Senior)', minSalary: 450000, maxSalary: 600000, stepIncrement: 20000 }
];

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  notifications: { email: true, push: true, sms: false, criticalOnly: false },
  workspace: { compactMode: false, sidebarCollapsed: false, defaultHub: 'Lagos HQ' },
  governance: { auditLevel: 'HIGH', enforceMFA: true },
  compliance: DEFAULT_COMPLIANCE,
  salaryBands: DEFAULT_BANDS
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('suler_settings_v2');
      if (saved) setSettings(JSON.parse(saved));
    };
    loadSettings();
  }, []);

  const updateSettings = (updates: Partial<Settings> | ((prev: Settings) => Settings)) => {
    setSettings(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('suler_settings_v2', JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('suler_settings_v2');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
