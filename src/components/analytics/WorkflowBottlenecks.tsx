"use client";

import React from 'react';
import { WorkflowBottleneck } from '@/modules/analytics/domain/analytics.model';
import { Clock, AlertTriangle, ChevronRight } from 'lucide-react';

interface WorkflowBottlenecksProps {
  bottlenecks: WorkflowBottleneck[];
}

export function WorkflowBottlenecks({ bottlenecks }: WorkflowBottlenecksProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARNING': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Process Bottlenecks</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Approval Turnaround Analysis</p>
        </div>
      </div>

      <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1">
        {bottlenecks.map((item) => (
          <div key={item.departmentId} className="p-5 hover:bg-white/[0.02] transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${getStatusStyles(item.status)}`}>
                  {item.departmentName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">{item.departmentName}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.pendingCount} Pending Requests</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold tracking-tight ${item.status === 'CRITICAL' ? 'text-red-400' : 'text-white'}`}>
                  {item.averageApprovalHours}h
                </p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Avg Delay</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  <span>Rejection Rate</span>
                  <span>{item.rejectionRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(item.rejectionRate * 5, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {item.status !== 'NORMAL' && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-950/50 border border-white/5">
                  <AlertTriangle className={`w-3 h-3 ${item.status === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${item.status === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                    Operational Friction Detected
                  </span>
                </div>
                <button className="p-1 rounded-md hover:bg-white/5 text-zinc-600 hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-950/30 border-t border-white/5 text-center">
        <button className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-400 transition-colors">
          View Detailed Flow Metrics
        </button>
      </div>
    </div>
  );
}
