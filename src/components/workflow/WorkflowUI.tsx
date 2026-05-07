"use client";

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Ban, ArrowRight } from 'lucide-react';
import { WorkflowInstance, WorkflowDefinition, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { useAccess } from '@/context/AccessContext';

/**
 * Visual timeline showing workflow history and current status.
 * Refined for "Premium Operational Workspace" - high contrast, minimalist.
 */
export function ApprovalTimeline({ instance }: { instance: WorkflowInstance }) {
  return (
    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
      {instance.history.map((entry) => (
        <div key={entry.id} className="relative pl-10 group">
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 z-10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-100">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
          </div>
          <div>
            <div className="flex flex-col mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-tight">{entry.action.replace(/_/g, ' ')}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              Validated by <span className="text-indigo-600">{entry.actorName}</span>
            </div>
            {entry.comment && (
              <div className="text-[12px] font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-3 leading-relaxed">
                "{entry.comment}"
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Current State Indicator */}
      <div className="relative pl-10">
        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-600 z-10 flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
           <Clock className="w-3 h-3 text-white" />
        </div>
        <div className="pt-1">
          <span className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.1em]">Current: {instance.currentState.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Contextual action bar that shows allowed workflow transitions based on permissions.
 * Refined with "Executive Capsular" buttons.
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

  const availableActions = allowedActions.filter(actionKey => {
    const transition = definition.transitions[actionKey];
    if (user.role === 'SUPER_ADMIN') return true;
    if (transition.requiredRole && user.role !== transition.requiredRole) return false;
    return true;
  });

  if (availableActions.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 bg-slate-50/50 border border-slate-100 rounded-[24px]">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">No pending actions for your role</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
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
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] ${
              isReject 
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {isReject ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {trans.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Standardized status badge for workflows.
 * Refined with "Tonal Pill" aesthetic.
 */
export function WorkflowStatusBadge({ state }: { state: string }) {
  const variants: Record<string, { bg: string, text: string, icon: any }> = {
    'DRAFT': { bg: 'bg-slate-50', text: 'text-slate-500', icon: Clock },
    'SUBMITTED': { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Clock },
    'MANAGER_APPROVED': { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: CheckCircle2 },
    'APPROVED': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    'REJECTED': { bg: 'bg-rose-50', text: 'text-rose-600', icon: AlertCircle },
    'CANCELLED': { bg: 'bg-slate-50', text: 'text-slate-400', icon: Ban },
  };

  const config = variants[state] || variants['DRAFT'];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bg} ${config.text} rounded-full border border-current/10`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{state.replace(/_/g, ' ')}</span>
    </div>
  );
}
