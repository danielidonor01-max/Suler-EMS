"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface ActivityLog {
  id: string;
  type: 'MUTATION' | 'ACCESS' | 'GOVERNANCE' | 'SYSTEM' | 'SECURITY' | 'FINANCE' | 'IAM';
  actor: string;
  author: string;
  action: string;
  label: string;
  message: string;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';
  hub?: string;
  metadata?: any;
  timestamp: string;
}

interface ActivityContextType {
  presenceCount: number;
  recentActivity: ActivityLog[];
  activities: ActivityLog[];
  pushActivity: (item: Partial<ActivityLog>) => void;
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
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

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

  const pushActivity = useCallback((data: Partial<ActivityLog>) => {
    const actor = data.actor || data.author || 'SYSTEM';
    const action = data.action || data.label || 'Unknown Action';
    const newItem: ActivityLog = {
      message: '',
      status: 'INFO',
      type: 'SYSTEM',
      ...data,
      actor,
      action,
      author: actor,
      label: action,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    setRecentActivity(prev => [newItem, ...prev].slice(0, 50));
    console.log(`[Activity Log]: ${newItem.actor} - ${newItem.action}`);
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
