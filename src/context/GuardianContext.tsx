"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface ApprovalRequest {
  id: string;
  type: 'BULK_DELETE' | 'ROLE_CHANGE' | 'REGIONAL_MOVE' | 'HIERARCHY_SHIFT';
  label: string;
  description: string;
  requester: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requiredApprovals: number;
  currentApprovals: number;
  payload: any;
  mutationType: string;
}

interface GuardianContextValue {
  activeRequests: ApprovalRequest[];
  requestApproval: (request: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status' | 'currentApprovals'>) => Promise<boolean>;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  isGuardianMode: boolean;
  setGuardianMode: (active: boolean) => void;
  alertLevel: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  monitorMutation: () => void;
}

const GuardianContext = createContext<GuardianContextValue | undefined>(undefined);

export const GuardianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState<ApprovalRequest[]>([]);
  const [isGuardianMode, setGuardianMode] = useState(false);
  const [alertLevel, setAlertLevel] = useState<'NORMAL' | 'ELEVATED' | 'CRITICAL'>('NORMAL');
  const [mutationHistory, setMutationHistory] = useState<{timestamp: number}[]>([]);
  
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();

  // Behavior-based Anomaly Detection (Velocity Check)
  const monitorMutation = useCallback(() => {
    const now = Date.now();
    const windowStart = now - 60000; // 60s window
    const recentMutations = [...mutationHistory.filter(m => m.timestamp > windowStart), { timestamp: now }];
    
    setMutationHistory(recentMutations);

    if (recentMutations.length >= 10) {
      setAlertLevel('CRITICAL');
      pushActivity({
        type: 'SECURITY',
        label: 'Anomaly Escalation',
        message: `High-velocity mutation stream detected [${recentMutations.length} ops/min]. Autonomous lockdown protocol initiated.`,
        author: 'Guardian AI',
        status: 'FAILURE'
      } as any);
    } else if (recentMutations.length >= 5) {
      setAlertLevel('ELEVATED');
    } else {
      setAlertLevel('NORMAL');
    }
  }, [mutationHistory, pushActivity]);

  const requestApproval = useCallback(async (data: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status' | 'currentApprovals'>) => {
    const id = `REQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newRequest: ApprovalRequest = {
      ...data,
      id,
      timestamp: Date.now(),
      status: 'PENDING',
      currentApprovals: 0
    };

    setActiveRequests(prev => [...prev, newRequest]);

    pushActivity({
      type: 'SECURITY',
      label: 'Governance Approval Required',
      message: `A sensitive operation [${data.label}] has been intercepted. Multi-signature authorization requested.`,
      author: userRole,
      status: 'PENDING'
    } as any);

    // Return a promise that resolves when the request is approved/rejected
    // For now, we'll just return true to simulate the start of the flow
    return true; 
  }, [pushActivity, userRole]);

  const approveRequest = useCallback((id: string) => {
    setActiveRequests(prev => prev.map(req => {
      if (req.id === id) {
        const nextApprovals = req.currentApprovals + 1;
        const isFullyApproved = nextApprovals >= req.requiredApprovals;
        
        if (isFullyApproved) {
           pushActivity({
             type: 'GOVERNANCE',
             label: 'Operational Clearance Granted',
             message: `Multi-signature protocol complete for [${req.label}]. Execution authorized.`,
             author: 'System Guardian',
             status: 'SUCCESS'
           } as any);
        }

        return { 
          ...req, 
          currentApprovals: nextApprovals,
          status: isFullyApproved ? 'APPROVED' : 'PENDING'
        };
      }
      return req;
    }));
  }, [pushActivity]);

  const rejectRequest = useCallback((id: string) => {
    setActiveRequests(prev => prev.map(req => {
      if (req.id === id) {
        pushActivity({
          type: 'SECURITY',
          label: 'Operation Vetoed',
          message: `Administrative override: [${req.label}] has been rejected by governance protocols.`,
          author: 'System Guardian',
          status: 'FAILURE'
        } as any);
        return { ...req, status: 'REJECTED' };
      }
      return req;
    }));
  }, [pushActivity]);

  return (
    <GuardianContext.Provider value={{
      activeRequests,
      requestApproval,
      approveRequest,
      rejectRequest,
      isGuardianMode,
      setGuardianMode,
      alertLevel,
      monitorMutation
    }}>
      {children}
    </GuardianContext.Provider>
  );
};

export const useGuardian = () => {
  const context = useContext(GuardianContext);
  if (!context) throw new Error('useGuardian must be used within GuardianProvider');
  return context;
};
