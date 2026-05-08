"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface MutationTrace {
  id: string;
  label: string;
  startTime: number;
  endTime?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'CONFLICT';
  latency?: number;
  correlationId: string;
}

interface ObservabilityState {
  traces: MutationTrace[];
  syncHealth: 'HEALTHY' | 'DEGRADED' | 'STALE';
  lastHeartbeat: number;
  reconciliationFailures: number;
  isRecovering: boolean;
}

interface ObservabilityContextValue extends ObservabilityState {
  startTrace: (label: string) => string;
  endTrace: (id: string, status: MutationTrace['status']) => void;
  reportSyncFailure: () => void;
  clearTraces: () => void;
}

const ObservabilityContext = createContext<ObservabilityContextValue | undefined>(undefined);

export const ObservabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [traces, setTraces] = useState<MutationTrace[]>([]);
  const [syncHealth, setSyncHealth] = useState<'HEALTHY' | 'DEGRADED' | 'STALE'>('HEALTHY');
  const [reconciliationFailures, setReconciliationFailures] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
  const [isRecovering, setIsRecovering] = useState(false);

  // Auto-Recovery Side Effect
  useEffect(() => {
    if (syncHealth === 'STALE' && !isRecovering) {
      const recoveryTimeout = setTimeout(() => {
        setIsRecovering(true);
        // Simulate a Hard Reset of the synchronization engine
        setTimeout(() => {
          setSyncHealth('HEALTHY');
          setLastHeartbeat(Date.now());
          setIsRecovering(false);
          setReconciliationFailures(0);
        }, 3000);
      }, 15000); // 15s persistent stale triggers recovery

      return () => clearTimeout(recoveryTimeout);
    }
  }, [syncHealth, isRecovering]);

  // Heartbeat monitor for multi-tab sync health
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // If no heartbeat from other tabs/system in 10s, consider degraded
      if (now - lastHeartbeat > 10000) {
        setSyncHealth('STALE');
      } else if (now - lastHeartbeat > 5000) {
        setSyncHealth('DEGRADED');
      } else {
        setSyncHealth('HEALTHY');
      }

      // Broadcast our heartbeat
      localStorage.setItem('suler_heartbeat', now.toString());
    }, 2000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'suler_heartbeat') {
        setLastHeartbeat(Number(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [lastHeartbeat]);

  const startTrace = useCallback((label: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    const correlationId = `TRC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    setTraces(prev => [{
      id,
      label,
      startTime: Date.now(),
      status: 'PENDING',
      correlationId
    }, ...prev].slice(0, 50)); // Keep last 50 traces

    return id;
  }, []);

  const endTrace = useCallback((id: string, status: MutationTrace['status']) => {
    setTraces(prev => prev.map(t => {
      if (t.id === id) {
        const endTime = Date.now();
        return {
          ...t,
          endTime,
          status,
          latency: endTime - t.startTime
        };
      }
      return t;
    }));
  }, []);

  const reportSyncFailure = useCallback(() => {
    setReconciliationFailures(prev => prev + 1);
    setSyncHealth('DEGRADED');
  }, []);

  const clearTraces = useCallback(() => setTraces([]), []);

  return (
    <ObservabilityContext.Provider value={{
      traces,
      syncHealth,
      lastHeartbeat,
      reconciliationFailures,
      isRecovering,
      startTrace,
      endTrace,
      reportSyncFailure,
      clearTraces
    }}>
      {children}
    </ObservabilityContext.Provider>
  );
};

export const useObservability = () => {
  const context = useContext(ObservabilityContext);
  if (!context) throw new Error('useObservability must be used within ObservabilityProvider');
  return context;
};
