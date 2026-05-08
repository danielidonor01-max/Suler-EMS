"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  notifications: {
    email: true,
    push: true,
    sms: false,
    criticalOnly: false,
  },
  workspace: {
    compactMode: false,
    sidebarCollapsed: false,
    defaultHub: 'Lagos HQ',
  },
  governance: {
    auditLevel: 'HIGH',
    enforceMFA: true,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('suler_settings');
      if (saved) setSettings(JSON.parse(saved));
    };

    loadSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_settings') {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (updates: Partial<Settings> | ((prev: Settings) => Settings)) => {
    setSettings(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('suler_settings', JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('suler_settings');
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
