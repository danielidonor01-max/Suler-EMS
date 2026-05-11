"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Command, 
  Users, 
  Building2, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface GlobalCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalCommandModal: React.FC<GlobalCommandModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');

  // Close on Escape is handled by common Modal
  // Here we handle the CMD+K toggle if we want it global, but it's already in Header.

  const actions = [
    { icon: Users, label: 'Add Employee', shortcut: 'E', category: 'Workforce' },
    { icon: Building2, label: 'Establish Hub', shortcut: 'H', category: 'Organization' },
    { icon: ShieldCheck, label: 'Audit Logs', shortcut: 'A', category: 'Governance' },
    { icon: FileText, label: 'Generate Report', shortcut: 'R', category: 'Intelligence' },
    { icon: Activity, label: 'System Health', shortcut: 'S', category: 'System' },
    { icon: Settings, label: 'Account Settings', shortcut: ',', category: 'Preferences' },
  ];

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Command Palette" 
      subtitle="Operational Quick Actions"
      size="md"
    >
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands or operational data..." 
            className="w-full h-[56px] bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400">
            <span className="opacity-60">ESC TO CLOSE</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</h4>
            <div className="flex items-center gap-1">
               <Sparkles className="w-3 h-3 text-indigo-500" />
               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Intelligence Driven</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {filteredActions.map((action, idx) => (
              <button 
                key={idx}
                className="group flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <action.icon className="w-5 h-5 stroke-[1.5px]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[13px] font-bold text-slate-900 leading-none mb-1">{action.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{action.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-400 group-hover:bg-white transition-colors">
                    {action.shortcut}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className="p-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500">↑↓</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigate</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="p-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500">↵</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execute</span>
             </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Suler EMS v1.0</span>
        </div>
      </div>
    </Modal>
  );
};
