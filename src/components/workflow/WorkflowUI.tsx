"use client";

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Ban, History, ShieldCheck } from 'lucide-react';
import { WorkflowInstance, WorkflowDefinition, WorkflowAction } from '@/modules/workflow/domain/workflow.types';
import { useAccess } from '@/context/AccessContext';

/**
 * Visual timeline showing workflow history and current status.
 * Refined for "Mature Operational Workspace" - high precision, professional tracking.
 */
export function ApprovalTimeline({ instance }: { instance: WorkflowInstance }) {
  return (
    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
      {instance.history.map((entry) => (
        <div key={entry.id} className="relative pl-10 group">
          <div className="absolute left-0 top-1.5 w-6 h-6 rounded-lg bg-white border-2 border-slate-900 z-10 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>
          <div className="animate-in">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[13px] font-black text-slate-900 tracking-tight">{entry.action.replace(/_/g, ' ')}</span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              Validated by <span className="text-slate-900">{entry.actorName}</span> • <span className="text-[9px]">{entry.actorRole}</span>
            </div>
            {entry.comment && (
              <div className="text-[12px] font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3 leading-relaxed relative italic">
                "{entry.comment}"
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Current State Indicator */}
      <div className="relative pl-10">
        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 z-10 flex items-center justify-center shadow-sm">
           <Clock className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="pt-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            PENDING: {instance.currentState.replace(/_/g, ' ')}
            <div className="w-1 h-1 rounded-full bg-slate-200 animate-pulse" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Contextual action bar that shows allowed workflow transitions based on permissions.
 * Refined with "Mature Executive" buttons.
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
      <div className="flex items-center gap-3 p-5 bg-slate-50 border border-slate-100 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-slate-300" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Awaiting higher-level governance authorization</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
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
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] border ${
              isReject 
                ? 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50' 
                : 'bg-slate-900 text-white border-transparent hover:bg-black'
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
 * Refined with "Mature Label" aesthetic.
 */
export function WorkflowStatusBadge({ state }: { state: string }) {
  const variants: Record<string, { bg: string, text: string, border: string, icon: any }> = {
    'DRAFT': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', icon: Clock },
    'SUBMITTED': { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-100/50', icon: Clock },
    'MANAGER_APPROVED': { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-100/50', icon: CheckCircle2 },
    'APPROVED': { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100/50', icon: CheckCircle2 },
    'REJECTED': { bg: 'bg-rose-50/50', text: 'text-rose-600', border: 'border-rose-100/50', icon: AlertCircle },
    'CANCELLED': { bg: 'bg-slate-100/50', text: 'text-slate-400', border: 'border-slate-200/50', icon: Ban },
  };

  const config = variants[state] || variants['DRAFT'];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 ${config.bg} ${config.text} rounded-lg border ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{state.replace(/_/g, ' ')}</span>
    </div>
  );
}
