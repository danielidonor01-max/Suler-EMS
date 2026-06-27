"use client";

/**
 * SettingsContext — display-only catalogue for surfaces with no DB yet.
 *
 * Previously this context held every imaginable settings shape (theme,
 * notifications, workspace, security/MFA, sessions, compliance, salary
 * bands, integrations…) backed by localStorage. Most of it became
 * obsolete once each domain got its real source of truth:
 *
 *   theme              → PreferencesContext (per-user, server-stored)
 *   security policies  → SystemSetting + /settings/security
 *   compliance / tax   → StatutoryRate + /payroll/statutory-rates
 *   sessions           → SessionAudit table
 *
 * What's left here is the integrations status cards + API key
 * catalogue rendered on /settings/integrations. Those don't have a
 * Prisma model yet (integration credentials are environment-variable
 * managed), so this context still provides the display catalogue and
 * the localStorage-backed connect/disconnect toggle state. That's the
 * one thing this context owns.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

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

interface Settings {
  integrations: {
    status:  Integration[];
    apiKeys: ApiKey[];
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  pushGovernanceActivity: (label: string, message: string) => void;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'slack',     name: 'Slack',            connected: true,  lastSync: '2 min ago'  },
  { id: 'email',     name: 'SMTP Email',       connected: true,  lastSync: '5 min ago'  },
  { id: 'analytics', name: 'Google Analytics', connected: false, lastSync: null         },
  { id: 'zapier',    name: 'Zapier',           connected: false, lastSync: null         },
  { id: 'hrms',      name: 'HRMS Export',      connected: true,  lastSync: '1 hour ago' },
];

const DEFAULT_SETTINGS: Settings = {
  integrations: {
    status:  DEFAULT_INTEGRATIONS,
    apiKeys: [
      {
        id:        'KEY-001',
        name:      'Production API Key',
        prefix:    'suler_prod_',
        created:   '2026-01-15',
        lastUsed:  '2 min ago',
        scopes:    ['read', 'write'],
      },
    ],
  },
};

const STORAGE_KEY = 'suler_settings_v4';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch {
      // ignore malformed cache; fall back to defaults
    }
    // Also clear the v3 cache so users don't carry dead state forward.
    localStorage.removeItem('suler_settings_v3');
  }, []);

  const updateSettings = (updates: Partial<Settings> | ((prev: Settings) => Settings)) => {
    setSettings(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const pushGovernanceActivity = (label: string, message: string) => {
    pushActivity({
      type: 'GOVERNANCE',
      label,
      message,
      author: userRole,
      status: 'SUCCESS',
    } as any);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, pushGovernanceActivity }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
