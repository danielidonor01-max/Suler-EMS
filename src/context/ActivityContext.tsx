"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

export interface ActivityItem {
  id: string;
  type: 'MUTATION' | 'ACCESS' | 'GOVERNANCE' | 'SYSTEM' | 'SECURITY' | 'FINANCE' | 'IAM';
  actor: string;
  author?: string;
  action: string;
  label?: string;
  hub?: string;
  message?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING' | string;
  timestamp: string;
  metadata?: any;
}

// Alias for backward compatibility
export type ActivityLog = ActivityItem;


interface ActivityContextType {
  presenceCount: number;
  recentActivity: ActivityItem[];
  activities: ActivityItem[];
  pushActivity: (item: any) => void;
  broadcastPresence: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [presenceCount, setPresenceCount] = useState(1); // Default to at least the current user
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const localIdsRef = useRef<Set<string>>(new Set());

  // Simulation of presence tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(24, prev + delta));
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate from server-side audit feed (workflow transitions + security events).
  // Local pushActivity calls are preserved by tracking their ids and merging.
  useEffect(() => {
    let cancelled = false;
    async function loadAudit() {
      try {
        const res = await fetch('/api/audit/recent?limit=50', { credentials: 'include' });
        if (!res.ok) return;
        const body = await res.json();
        const items: ActivityItem[] = (body?.data ?? []) as ActivityItem[];
        if (cancelled) return;
        setRecentActivity(prev => {
          const localOnly = prev.filter(p => localIdsRef.current.has(p.id));
          const merged = [...localOnly, ...items]
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 50);
          return merged;
        });
      } catch {
        // silent — context falls back to whatever pushActivity has accumulated
      }
    }
    loadAudit();
    const poll = setInterval(loadAudit, 30_000);
    return () => { cancelled = true; clearInterval(poll); };
  }, []);

  const pushActivity = useCallback((data: any) => {
    const id = Math.random().toString(36).substring(2, 9);
    localIdsRef.current.add(id);
    const newItem: ActivityItem = {
      ...data,
      id,
      timestamp: new Date().toISOString()
    };
    setRecentActivity(prev => [newItem, ...prev].slice(0, 50));
    console.log(`[Activity Log]: ${data.author || data.actor} - ${data.label || data.action}`);
  }, []);

  const broadcastPresence = useCallback(() => {
    // In a real app, this would send a websocket heartbeat
    console.log('[Presence]: Broadcasting heartbeat...');
  }, []);

  return (
    <ActivityContext.Provider value={{ presenceCount, recentActivity, activities: recentActivity, pushActivity, broadcastPresence }}>
      {children}
    </ActivityContext.Provider>
  );
};
