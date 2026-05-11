"use client";

import React from 'react';
import { WorkflowBottleneck } from '@/modules/analytics/domain/analytics.model';
import { Clock, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

interface WorkflowBottlenecksProps {
  bottlenecks: WorkflowBottleneck[];
}

export function WorkflowBottlenecks({ bottlenecks }: WorkflowBottlenecksProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
        {bottlenecks.map((item) => (
          <div key={item.departmentId} className="p-8 rounded-[28px] border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden">
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${item.status === 'CRITICAL' ? 'bg-rose-500' : item.status === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${getStatusStyles(item.status)}`}>
                  {item.departmentName[0]}
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 tracking-tight">{item.departmentName}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.pendingCount} Active Requests</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black tracking-tighter leading-none ${item.status === 'CRITICAL' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {item.averageApprovalHours}h
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Avg Lead Time</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 mb-2.5">
                  <span>Rejection Rate</span>
                  <span className="text-slate-900">{item.rejectionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${item.status === 'CRITICAL' ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(item.rejectionRate * 5, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {item.status !== 'NORMAL' && (
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                  <AlertTriangle className={`w-3.5 h-3.5 ${item.status === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {item.status} Operational Friction
                  </span>
                </div>
                <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button className="w-full py-4 rounded-2xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
          View Detailed Analytics
        </button>
      </div>
    </div>
  );
}
