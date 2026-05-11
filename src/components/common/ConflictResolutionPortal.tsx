"use client";

import React from 'react';
import { AlertCircle, RefreshCcw, X, ArrowRight, ShieldAlert, History } from 'lucide-react';
import { Modal } from './Modal';

interface ConflictResolutionPortalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  localState: any;
  serverState: any;
  onResolve: (action: 'RELOAD' | 'OVERWRITE' | 'DISCARD') => void;
}

export const ConflictResolutionPortal: React.FC<ConflictResolutionPortalProps> = ({
  isOpen,
  onClose,
  entityName,
  localState,
  serverState,
  onResolve
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Governance Conflict Detected"
      subtitle="Structural Version Mismatch (Optimistic Concurrency Control)"
      size="lg"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
        {/* Warning Banner */}
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-[24px] flex items-start gap-5">
           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm shrink-0">
              <ShieldAlert className="w-6 h-6" />
           </div>
           <div className="space-y-1">
              <h4 className="text-[15px] font-black text-rose-900 tracking-tight">Concurrent Modification Detected</h4>
              <p className="text-[13px] text-rose-700/70 font-medium leading-relaxed">
                Another administrator modified **{entityName}** while your session was active. To prevent organizational state corruption, the current mutation has been intercepted.
              </p>
           </div>
        </div>

        {/* State Comparison */}
        <div className="grid grid-cols-2 gap-6">
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <History className="w-3.5 h-3.5 text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Pending Changes</span>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-[24px] min-h-[200px]">
                 <pre className="text-[11px] font-mono text-slate-600 overflow-auto max-h-[150px]">
                    {JSON.stringify(localState, null, 2)}
                 </pre>
              </div>
           </div>
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <RefreshCcw className="w-3.5 h-3.5 text-indigo-500" />
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Authoritative Server State</span>
              </div>
              <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-[24px] min-h-[200px]">
                 <pre className="text-[11px] font-mono text-indigo-900/70 overflow-auto max-h-[150px]">
                    {JSON.stringify(serverState, null, 2)}
                 </pre>
              </div>
           </div>
        </div>

        {/* Resolution Intelligence Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button 
             onClick={() => onResolve('RELOAD')}
             className="p-6 bg-white border border-slate-200 rounded-[28px] text-left hover:border-indigo-400 hover:shadow-xl transition-all group relative overflow-hidden"
           >
              <div className="relative z-10 space-y-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                 </div>
                 <div>
                    <h5 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Reconcile & Refresh</h5>
                    <p className="text-[11px] text-slate-400 font-medium">Discard local draft and sync with the latest authoritative state.</p>
                 </div>
              </div>
              <ArrowRight className="absolute right-6 bottom-6 w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
           </button>

           <button 
             onClick={() => onResolve('OVERWRITE')}
             className="p-6 bg-slate-900 rounded-[28px] text-left hover:bg-black hover:shadow-2xl transition-all group relative overflow-hidden"
           >
              <div className="relative z-10 space-y-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/10">
                    <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="text-[14px] font-black text-white uppercase tracking-tight">Force Authorization</h5>
                    <p className="text-[11px] text-slate-400 font-medium">Overwrite server state with local draft (Administrative override).</p>
                 </div>
              </div>
              <ArrowRight className="absolute right-6 bottom-6 w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
           </button>
        </div>

        <div className="flex items-center justify-center pt-2">
           <button 
             onClick={onClose}
             className="text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-colors"
           >
             Cancel Resolution Flow
           </button>
        </div>
      </div>
    </Modal>
  );
};
