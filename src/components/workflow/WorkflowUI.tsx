"use client";

import React from 'react';
import { WorkflowInstance, WorkflowDefinition, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { useAccess } from '@/context/AccessContext';
import { StatusBadge, BadgeVariant } from '../ui/StatusBadge';

/**
 * Visual timeline showing workflow history and current status.
 */
export function ApprovalTimeline({ instance }: { instance: WorkflowInstance }) {
  return (
    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
      {instance.history.map((entry, idx) => (
        <div key={entry.id} className="relative pl-10">
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-2 border-primary z-10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-text-primary">{entry.action.replace(/_/g, ' ')}</span>
              <span className="text-[11px] text-text-muted">{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            <div className="text-xs text-text-secondary mb-1">
              By <span className="font-medium text-text-primary">{entry.actorName}</span> ({entry.actorRole})
            </div>
            {entry.comment && (
              <div className="text-xs italic bg-bg p-2 rounded border border-border mt-1">
                "{entry.comment}"
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Current State Indicator */}
      <div className="relative pl-10">
        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-container border-2 border-primary z-10 flex items-center justify-center">
           <span className="material-symbols-outlined text-[14px] text-white">pending</span>
        </div>
        <div className="pt-1">
          <span className="text-sm font-bold text-primary">Current State: {instance.currentState.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Contextual action bar that shows allowed workflow transitions based on permissions.
 */
export function WorkflowActionBar({ 
  instance, 
  definition, 
  onAction 
}: { 
  instance: WorkflowInstance, 
  definition: WorkflowDefinition,
  onAction: (action: WorkflowAction, comment?: string) => void
}) {
  const { user } = useAccess();
  const currentStateDef = definition.states[instance.currentState];
  const allowedActions = currentStateDef?.allowedActions || [];

  // Filter actions based on role/permissions (Mock evaluation for UI)
  const availableActions = allowedActions.filter(actionKey => {
    const transition = definition.transitions[actionKey];
    if (user.role === 'SUPER_ADMIN') return true;
    if (transition.requiredRole && user.role !== transition.requiredRole) return false;
    // ... add more permission checks if needed
    return true;
  });

  if (availableActions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-surface border border-border rounded-xl shadow-sm">
      {availableActions.map(action => {
        const trans = definition.transitions[action];
        const isReject = action.toLowerCase().includes('reject');
        
        return (
          <button
            key={action}
            onClick={() => {
              const comment = isReject ? prompt(`Enter reason for rejection:`) : undefined;
              if (isReject && !comment) return;
              onAction(action, comment || undefined);
            }}
            className={`btn btn-sm ${isReject ? 'btn-danger' : 'btn-primary'}`}
          >
            {trans.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Standardized status badge for workflows.
 */
export function WorkflowStatusBadge({ state }: { state: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    'DRAFT': 'info',
    'SUBMITTED': 'warning',
    'MANAGER_APPROVED': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'CANCELLED': 'info',
  };

  return (
    <StatusBadge variant={variantMap[state] || 'info'}>
      {state.replace(/_/g, ' ')}
    </StatusBadge>
  );
}
