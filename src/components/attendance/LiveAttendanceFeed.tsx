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
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

const LiveAttendanceFeed: React.FC = () => {
  const { lastAttendance } = useRealtime();
  
  // Simulated history for visualization
  const history = [
    { id: '1', name: 'Aisha Yusuf', time: '10:42 AM', type: 'CHECK_IN', location: 'Abuja Branch', status: 'VERIFIED' },
    { id: '2', name: 'Babajide Cole', time: '10:38 AM', type: 'CHECK_OUT', location: 'Lagos HQ', status: 'VERIFIED' },
    { id: '3', name: 'Chidera Nwosu', time: '10:35 AM', type: 'CHECK_IN', location: 'Port Harcourt', status: 'GEO_MISMATCH' },
  ];

  const displayData = lastAttendance ? [lastAttendance, ...history] : history;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Attendance</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realtime Stream Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
          <Wifi className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Branch Nodes: 12 Online</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {displayData.map((log, index) => (
            <motion.div
              key={log.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-2xl border transition-all hover:shadow-md hover:translate-x-1 ${
                log.status === 'GEO_MISMATCH' 
                  ? 'bg-rose-50/50 border-rose-100' 
                  : 'bg-white border-slate-100 hover:border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    log.status === 'GEO_MISMATCH' ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{log.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <MapPin className="w-3 h-3" />
                        {log.location}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {log.time}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                    log.type === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {log.type}
                  </span>
                  <div className="flex items-center gap-1">
                    {log.status === 'VERIFIED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                      log.status === 'VERIFIED' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-50">
        <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center gap-2 group shadow-sm">
          View Detailed Analytics
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LiveAttendanceFeed;
