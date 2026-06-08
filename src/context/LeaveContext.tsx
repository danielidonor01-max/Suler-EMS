"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { WorkflowInstance, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { WorkflowEngine } from '@/modules/workflow/engine/workflow.engine';
import { LeaveWorkflow } from '@/modules/workflow/definitions/leave.workflow';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface LeaveRequest extends WorkflowInstance {
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

interface LeaveContextType {
  requests: LeaveRequest[];
  submitLeaveRequest: (data: {
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) => { success: boolean; error?: string };
  executeLeaveAction: (requestId: string, action: WorkflowAction, comment?: string) => { success: boolean; error?: string };
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};

// Initial mock requests, matching leave/admin/page.tsx
const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-001' as any,
    workflowId: 'leave-workflow',
    version: 1,
    currentState: 'SUBMITTED',
    resourceId: 'res-001' as any,
    employeeId: 'SUL-EMP-001',
    employeeName: 'Alex Okereke',
    type: 'Annual Leave',
    startDate: '2026-06-10',
    endDate: '2026-06-14',
    days: 5,
    reason: 'Vacation with family in Enugu.',
    history: [
      {
        id: 'audit-001' as any,
        instanceId: 'leave-001' as any,
        timestamp: '2026-06-01T10:00:00Z',
        actorId: 'user-emp-001' as any,
        actorName: 'Alex Okereke',
        actorRole: 'EMPLOYEE',
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT',
        comment: 'Vacation with family in Enugu.'
      }
    ],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'leave-002' as any,
    workflowId: 'leave-workflow',
    version: 1,
    currentState: 'MANAGER_APPROVED',
    resourceId: 'res-002' as any,
    employeeId: 'SUL-MGR-001',
    employeeName: 'David Okafor',
    type: 'Sick Leave',
    startDate: '2026-05-06',
    endDate: '2026-05-07',
    days: 2,
    reason: 'Approved. Get well soon.',
    history: [
      {
        id: 'a1' as any,
        instanceId: 'leave-002' as any,
        timestamp: '2026-05-01T09:00:00Z',
        actorId: 'u1' as any,
        actorName: 'David Okafor',
        actorRole: 'EMPLOYEE',
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT'
      },
      {
        id: 'a2' as any,
        instanceId: 'leave-002' as any,
        timestamp: '2026-05-02T14:00:00Z',
        actorId: 'u2' as any,
        actorName: 'Segun Manager',
        actorRole: 'MANAGER',
        fromState: 'SUBMITTED',
        toState: 'MANAGER_APPROVED',
        action: 'APPROVE_MANAGER',
        comment: 'Approved. Get well soon.'
      },
    ],
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-02T14:00:00Z',
  },
  {
    id: 'leave-003' as any,
    workflowId: 'leave-workflow',
    version: 1,
    currentState: 'SUBMITTED',
    resourceId: 'res-003' as any,
    employeeId: 'SUL-HR-001',
    employeeName: 'Sarah Williams',
    type: 'Compassionate Leave',
    startDate: '2026-05-10',
    endDate: '2026-05-10',
    days: 1,
    reason: 'Family emergency.',
    history: [
      {
        id: 'a3' as any,
        instanceId: 'leave-003' as any,
        timestamp: '2026-05-09T11:00:00Z',
        actorId: 'u3' as any,
        actorName: 'Sarah Williams',
        actorRole: 'EMPLOYEE',
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        action: 'SUBMIT',
        comment: 'Family emergency.'
      }
    ],
    createdAt: '2026-05-09T11:00:00Z',
    updatedAt: '2026-05-09T11:00:00Z',
  },
];

export const LeaveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const { user } = useAccess();
  const { pushActivity } = useActivity();

  // Helper to submit a new leave request
  const submitLeaveRequest = useCallback((data: {
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) => {
    if (!user) {
      return { success: false, error: 'User must be authenticated to submit a request.' };
    }

    const newId = `leave-${String(requests.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    
    const newRequest: LeaveRequest = {
      id: newId as any,
      workflowId: 'leave-workflow',
      version: 1,
      currentState: 'SUBMITTED',
      resourceId: newId as any,
      employeeId: user.employeeId || user.id || 'EMP-001',
      employeeName: user.name || 'Employee',
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      reason: data.reason,
      history: [
        {
          id: crypto.randomUUID() as any,
          instanceId: newId as any,
          timestamp,
          actorId: user.id as any,
          actorName: user.name || 'Employee',
          actorRole: user.role as any,
          fromState: 'DRAFT',
          toState: 'SUBMITTED',
          action: 'SUBMIT',
          comment: data.reason,
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setRequests(prev => [newRequest, ...prev]);

    pushActivity({
      type: 'MUTATION',
      actor: user.name || 'Employee',
      action: 'LEAVE_SUBMITTED',
      label: 'Submit Leave Request',
      message: `Submitted a leave request of type ${data.type} for ${data.days} days starting on ${data.startDate}`,
      status: 'SUCCESS',
      metadata: { requestId: newId },
    });

    return { success: true };
  }, [user, requests.length, pushActivity]);

  // Execute a workflow state transition
  const executeLeaveAction = useCallback((requestId: string, action: WorkflowAction, comment?: string) => {
    if (!user) {
      return { success: false, error: 'User must be authenticated.' };
    }

    const targetIndex = requests.findIndex(r => r.id === requestId);
    if (targetIndex === -1) {
      return { success: false, error: 'Leave request not found.' };
    }

    const targetRequest = requests[targetIndex];

    const result = WorkflowEngine.executeTransition(LeaveWorkflow, {
      instance: targetRequest,
      actor: { id: user.id as any, name: user.name, role: user.role as any, permissions: user.permissions },
      action,
      comment,
      payload: { comment, type: targetRequest.type, days: targetRequest.days, startDate: targetRequest.startDate }
    });

    if (!result.success) {
      return { success: false, error: result.error?.message || 'Transition rejected by workflow engine.' };
    }

    const updatedRequest = {
      ...targetRequest,
      ...result.data,
    } as LeaveRequest;

    setRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));

    pushActivity({
      type: 'GOVERNANCE',
      actor: user.name || 'System',
      action: `LEAVE_${action}`,
      label: `Leave Request ${action}`,
      message: `Executed ${action} on leave request ${requestId} (new state: ${updatedRequest.currentState})`,
      status: 'SUCCESS',
      metadata: { requestId, action, toState: updatedRequest.currentState },
    });

    return { success: true };
  }, [user, requests, pushActivity]);

  const value = useMemo(() => ({
    requests,
    submitLeaveRequest,
    executeLeaveAction,
  }), [requests, submitLeaveRequest, executeLeaveAction]);

  return (
    <LeaveContext.Provider value={value}>
      {children}
    </LeaveContext.Provider>
  );
};
