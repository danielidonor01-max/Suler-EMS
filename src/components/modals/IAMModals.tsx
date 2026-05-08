"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  AlertTriangle,
  Fingerprint,
  Zap
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface EditRolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

export const EditRolePermissionsModal: React.FC<EditRolePermissionsModalProps> = ({ isOpen, onClose, role }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Configure Role: ${role}`} 
      subtitle="Capability Orchestration"
      size="lg"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="p-6 bg-slate-900 rounded-[24px] text-white space-y-4">
            <div className="flex items-center gap-3">
               <Lock className="w-5 h-5 text-indigo-400" />
               <h4 className="text-[13px] font-black uppercase tracking-widest">Global Authority Scope</h4>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
               Modifying permissions for **{role}** will immediately affect all associated staff across all hubs.
            </p>
         </div>

         <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
               {['Executive Governance', 'Workforce Records', 'Financial Data', 'Audit Logs', 'Workflow Override'].map((module) => (
                 <div key={module} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                          <ShieldCheck className="w-4 h-4" />
                       </div>
                       <span className="text-[13px] font-black text-slate-900 tracking-tight">{module}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={module === 'Workforce Records'} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
               ))}
            </div>
         </div>

         <div className="flex items-center justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 h-[44px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[44px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20">
               Update Role Policy
            </button>
         </div>
      </div>
    </Modal>
  );
};

interface RevokeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: string;
}

export const RevokeSessionModal: React.FC<RevokeSessionModalProps> = ({ isOpen, onClose, user }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Revoke Organizational Access" 
      subtitle="Identity Termination"
      size="sm"
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border-4 border-rose-100">
               <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Terminate Session?</h3>
               <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                 Are you sure you want to revoke access for **{user}**? This will immediately logout the user from all active devices.
               </p>
            </div>
         </div>

         <div className="flex flex-col gap-3 pt-4">
            <button className="bg-rose-600 hover:bg-rose-700 text-white w-full h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20">
               Terminate Immediately
            </button>
            <button onClick={onClose} className="w-full h-[48px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
               Cancel
            </button>
         </div>
      </div>
    </Modal>
  );
};
