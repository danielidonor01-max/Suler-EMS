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

  // Real presence: send a heartbeat to /api/presence/heartbeat every 30s
  // while this tab is open and update the count from the response. The
  // server-side store is in-memory per instance (see
  // src/lib/presence/store.ts for the multi-instance caveat); count
  // reflects the dyno this client happens to be talking to.
  //
  // Paused while the tab is hidden — a background tab doesn't need to
  // announce its presence, and stale entries fall out of the server-
  // side window naturally. Resumes immediately on visibility change.
  useEffect(() => {
    let cancelled = false;
    async function send() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/presence/heartbeat', {
          method:      'POST',
          credentials: 'include',
        });
        if (!res.ok || cancelled) return;
        const body = await res.json();
        const count = body?.data?.presenceCount ?? body?.presenceCount;
        if (typeof count === 'number') setPresenceCount(Math.max(1, count));
      } catch {
        // network blip — keep the prior count rather than spiking to 0
      }
    }
    send();
    const interval = setInterval(send, 30_000);
    // Snap-back: as soon as the tab comes back into focus, fire one
    // heartbeat so the count refreshes without waiting for the next tick.
    const onVisibility = () => { if (document.visibilityState === 'visible') send(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Hydrate from server-side audit feed (workflow transitions + security events).
  // Local pushActivity calls are preserved by tracking their ids and merging.
  // Paused when hidden; one snap-back fetch on focus so the feed is fresh
  // when the user returns.
  useEffect(() => {
    let cancelled = false;
    async function loadAudit() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
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
    const onVisibility = () => { if (document.visibilityState === 'visible') loadAudit(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
