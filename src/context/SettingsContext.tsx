"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

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

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  lastSync: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  scopes: string[];
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
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
  security: {
    enforceMFA: boolean;
    ipAllowlist: string[];
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      expiryDays: number;
    };
    sessions: UserSession[];
  };
  integrations: {
    status: Integration[];
    apiKeys: ApiKey[];
  };
  compliance: CompliancePolicy;
  salaryBands: SalaryBand[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  resetSettings: () => void;
  pushGovernanceActivity: (label: string, message: string) => void;
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

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'slack', name: 'Slack', connected: true, lastSync: '2 min ago' },
  { id: 'email', name: 'SMTP Email', connected: true, lastSync: '5 min ago' },
  { id: 'analytics', name: 'Google Analytics', connected: false, lastSync: null },
  { id: 'zapier', name: 'Zapier', connected: false, lastSync: null },
  { id: 'hrms', name: 'HRMS Export', connected: true, lastSync: '1 hour ago' },
];

const DEFAULT_SESSIONS: UserSession[] = [
  { id: 'S-001', device: 'Chrome on Windows', location: 'Lagos, Nigeria', ip: '197.210.66.12', lastActive: new Date().toISOString(), current: true },
  { id: 'S-002', device: 'Safari on iPhone 15', location: 'Abuja, Nigeria', ip: '197.210.78.44', lastActive: new Date().toISOString(), current: false },
];

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  notifications: { email: true, push: true, sms: false, criticalOnly: false },
  workspace: { compactMode: false, sidebarCollapsed: false, defaultHub: 'Lagos HQ' },
  security: {
    enforceMFA: true,
    ipAllowlist: ['197.210.0.0/16', '196.220.0.0/16'],
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
      expiryDays: 90
    },
    sessions: DEFAULT_SESSIONS
  },
  integrations: {
    status: DEFAULT_INTEGRATIONS,
    apiKeys: [
      { id: 'KEY-001', name: 'Production API Key', prefix: 'suler_prod_', created: '2026-01-15', lastUsed: '2 min ago', scopes: ['read', 'write'] }
    ]
  },
  compliance: DEFAULT_COMPLIANCE,
  salaryBands: DEFAULT_BANDS
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    const saved = localStorage.getItem('suler_settings_v3');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const updateSettings = (updates: Partial<Settings> | ((prev: Settings) => Settings)) => {
    setSettings(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('suler_settings_v3', JSON.stringify(next));
      return next;
    });
  };

  const pushGovernanceActivity = (label: string, message: string) => {
    pushActivity({
      type: 'GOVERNANCE',
      label,
      message,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('suler_settings_v3');
    pushGovernanceActivity('Factory Reset Triggered', 'System settings reverted to default enterprise baseline.');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, pushGovernanceActivity }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
