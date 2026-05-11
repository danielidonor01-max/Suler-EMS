"use client";

import React from 'react';
import { 
  History, 
  ShieldCheck, 
  Activity, 
  Lock, 
  UserCheck, 
  LogOut, 
  Settings,
  Clock,
  Fingerprint
} from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { Employee } from '@/context/WorkforceContext';

interface ForensicTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const MOCK_FORENSIC_EVENTS = [
  { id: 1, type: 'IAM', label: 'Identity Provisioned', timestamp: '2025-01-10 09:12', actor: 'SYSTEM_ROOT', desc: 'Initial identity established with Super Admin capability.' },
  { id: 2, type: 'IAM', label: 'Role Modified', timestamp: '2025-02-15 14:30', actor: 'GUARDIAN_AUTO', desc: 'Strategic Oversight permission added to profile.' },
  { id: 3, type: 'SECURITY', label: 'Session Established', timestamp: '2025-05-08 08:45', actor: 'SELF', desc: 'Login detected from Lagos, NG (MacBook Pro 16).' },
  { id: 4, type: 'GOVERNANCE', label: 'Policy Override', timestamp: '2025-05-08 11:20', actor: 'SELF', desc: 'Bypassed standard clinical threshold for emergency rebalance.' },
];

export const ForensicTimelineDrawer: React.FC<ForensicTimelineDrawerProps> = ({ isOpen, onClose, employee }) => {
  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Forensic Audit Trail" 
      subtitle={`Operational History: ${employee.name}`}
    >
      <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
         {/* Identity Summary Header */}
         <div className="flex items-center gap-5 p-6 bg-slate-900 rounded-[24px] text-white relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-black relative z-10">
               {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="space-y-1 relative z-10">
               <h3 className="text-[17px] font-black tracking-tight">{employee.name}</h3>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  <Fingerprint className="w-3 h-3" />
                  {employee.id}
               </div>
            </div>
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
               <History className="w-32 h-32" />
            </div>
         </div>

         {/* Event Timeline */}
         <div className="space-y-8 px-2">
            <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Snapshots</h4>
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Real-Time Sync</span>
            </div>

            <div className="relative space-y-12">
               {/* Timeline Line */}
               <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />

               {MOCK_FORENSIC_EVENTS.map((event, idx) => (
                 <div key={event.id} className="relative flex gap-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 border shadow-sm ${
                      event.type === 'IAM' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' :
                      event.type === 'SECURITY' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                      'bg-slate-900 text-white border-slate-800'
                    }`}>
                       {event.type === 'IAM' ? <ShieldCheck className="w-5 h-5" /> :
                        event.type === 'SECURITY' ? <Lock className="w-5 h-5" /> :
                        <Activity className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center justify-between">
                          <span className="text-[14px] font-black text-slate-900 tracking-tight">{event.label}</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                             <Clock className="w-3.5 h-3.5" />
                             {event.timestamp}
                          </div>
                       </div>
                       <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                          {event.desc}
                       </p>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized by:</span>
                          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{event.actor}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Security Footnote */}
         <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
               This audit trail is immutable and cryptographically linked to the **Suler Guardian** security cluster. Exporting this log requires Level 4 Executive clearance.
            </p>
         </div>
      </div>
    </Drawer>
  );
};
