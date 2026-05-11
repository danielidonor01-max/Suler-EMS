'use client';

import React from 'react';
import { Database, ShieldCheck, Activity } from 'lucide-react';

interface AttendanceSyncStatusProps {
  processedCount: number;
  healthStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
}

const healthColors: Record<string, string> = {
  OPTIMAL: 'text-emerald-600',
  DEGRADED: 'text-amber-600',
  CRITICAL: 'text-rose-600',
};

const AttendanceSyncStatus: React.FC<AttendanceSyncStatusProps> = ({
  processedCount = 1240,
  healthStatus = 'OPTIMAL'
}) => {
  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-white border border-slate-200 rounded-[24px] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-widest">Ingestion Ingress</span>
          <span className="text-xs font-bold text-slate-900">{processedCount.toLocaleString()} events today</span>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-200" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-widest">Trust Integrity</span>
          <span className={`text-xs font-bold ${healthColors[healthStatus] || 'text-slate-900'}`}>{healthStatus}</span>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-200" />

      <div className="flex items-center gap-3">
        <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pipeline Operational</span>
      </div>
    </div>
  );
};

export default AttendanceSyncStatus;
