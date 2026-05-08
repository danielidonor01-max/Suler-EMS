"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateOperationalId } from '@/lib/utils/generateOperationalId';

export interface ActivityEvent {
  id: string;
  type: 'PROVISIONING' | 'GOVERNANCE' | 'SECURITY' | 'SYSTEM';
  label: string;
  message: string;
  timestamp: string;
  author: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  hub?: string;
  correlationId?: string;
  version?: number;
}

export interface AppNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS' | 'SECURITY' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ActivityContextType {
  activities: ActivityEvent[];
  notifications: AppNotification[];
  presenceCount: number;
  pushActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  pushNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [presenceCount, setPresenceCount] = useState(1);

  // Initialize and Sync
  useEffect(() => {
    const loadState = () => {
      const savedActivities = localStorage.getItem('suler_activities');
      const savedNotifs = localStorage.getItem('suler_notifications');
      const savedPresence = localStorage.getItem('suler_presence');
      
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      if (savedPresence) setPresenceCount(parseInt(savedPresence));
    };

    loadState();

    // Increment presence on mount (new tab)
    const currentPresence = parseInt(localStorage.getItem('suler_presence') || '0');
    localStorage.setItem('suler_presence', (currentPresence + 1).toString());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'suler_activities' || e.key === 'suler_notifications' || e.key === 'suler_presence') {
        loadState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Decrement presence on unmount (close tab)
    const handleUnload = () => {
      const p = parseInt(localStorage.getItem('suler_presence') || '1');
      localStorage.setItem('suler_presence', Math.max(1, p - 1).toString());
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const pushActivity = (data: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...data,
      id: generateOperationalId('ACT'),
      timestamp: new Date().toISOString()
    };
    setActivities(prev => {
      const updated = [newEvent, ...prev].slice(0, 100);
      localStorage.setItem('suler_activities', JSON.stringify(updated));
      return updated;
    });

    // Auto-notify for critical types
    if (data.status === 'FAILURE' || data.type === 'SECURITY' || data.type === 'SYSTEM') {
      pushNotification({
        type: data.type === 'SECURITY' ? 'SECURITY' : 'SYSTEM',
        title: data.label,
        message: data.message,
        priority: data.status === 'FAILURE' ? 'CRITICAL' : 'HIGH'
      });
    }
  };

  const pushNotification = (data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...data,
      id: generateOperationalId('NOT'),
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [newNotif, ...notifications].slice(0, 50);
    setNotifications(updated);
    localStorage.setItem('suler_notifications', JSON.stringify(updated));
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('suler_notifications', JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('suler_notifications', JSON.stringify([]));
  };

  return (
    <ActivityContext.Provider value={{ 
      activities, 
      notifications, 
      presenceCount, 
      pushActivity, 
      pushNotification, 
      markAsRead, 
      clearNotifications 
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within an ActivityProvider');
  return context;
};
