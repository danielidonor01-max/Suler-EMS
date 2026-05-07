'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

const LiveAttendanceFeed: React.FC = () => {
  const { lastAttendance } = useRealtime();
  
  const history = [
    { id: '1', name: 'Aisha Yusuf', time: '10:42 AM', type: 'CHECK_IN', location: 'Abuja Branch', status: 'VERIFIED' },
    { id: '2', name: 'Babajide Cole', time: '10:38 AM', type: 'CHECK_OUT', location: 'Lagos HQ', status: 'VERIFIED' },
    { id: '3', name: 'Chidera Nwosu', time: '10:35 AM', type: 'CHECK_IN', location: 'Port Harcourt', status: 'GEO_MISMATCH' },
  ];

  const displayData = lastAttendance ? [lastAttendance, ...history] : history;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium overflow-hidden flex flex-col h-full animate-in">
      {/* Executive Command Header */}
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-[14px] font-extrabold text-slate-900 tracking-tight">Live Attendance Feed</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Realtime Governance Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
          <Wifi className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">12 Branch Nodes</span>
        </div>
      </div>

      {/* Operational Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/30">
        <AnimatePresence initial={false}>
          {displayData.map((log, index) => (
            <motion.div
              key={log.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/40 group ${
                log.status === 'GEO_MISMATCH' 
                  ? 'bg-rose-50/40 border-rose-100/50 hover:bg-rose-50' 
                  : 'bg-white border-slate-100 hover:border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center border transition-all ${
                    log.status === 'GEO_MISMATCH' 
                      ? 'bg-rose-100/30 border-rose-200/50 text-rose-600' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`text-[14px] font-bold ${log.status === 'GEO_MISMATCH' ? 'text-rose-900' : 'text-slate-900'}`}>{log.name}</h4>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <MapPin className="w-3 h-3" />
                        {log.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {log.time}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      log.type === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {log.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        log.status === 'VERIFIED' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-300 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Dashboard Link */}
      <div className="p-6 border-t border-slate-50 bg-white">
        <button className="w-full py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white transition-all flex items-center justify-center gap-2 group shadow-sm">
          Access Attendance Intelligence
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LiveAttendanceFeed;
