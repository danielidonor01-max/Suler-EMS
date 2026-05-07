'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, ShieldCheck, Activity } from 'lucide-react';

interface AttendanceSyncStatusProps {
  processedCount: number;
  healthStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
}

const AttendanceSyncStatus: React.FC<AttendanceSyncStatusProps> = ({ 
  processedCount = 1240, 
  healthStatus = 'OPTIMAL' 
}) => {
  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-widest">Ingestion Ingress</span>
          <span className="text-xs font-bold text-white">{processedCount.toLocaleString()} events today</span>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-800" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-widest">Trust Integrity</span>
          <span className="text-xs font-bold text-white">{healthStatus}</span>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-800" />

      <div className="flex items-center gap-3">
        <div className="relative">
          <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
          <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full" />
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pipeline Operational</span>
      </div>
    </div>
  );
};

export default AttendanceSyncStatus;
