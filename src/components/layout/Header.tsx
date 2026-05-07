'use client';

import React from 'react';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  Activity, 
  ShieldCheck, 
  Globe,
  Command
} from 'lucide-react';

const Header = () => {
  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-100/50 sticky top-0 z-30 px-8 flex items-center justify-between transition-all duration-300">
      {/* Global Command Search */}
      <div className="flex-1 max-w-[480px] group">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, workflows, or people..." 
            className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-2.5 pl-11 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
            <Command className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">K</span>
          </div>
        </div>
      </div>

      {/* Executive Operational Context */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4">
          {/* Status Chips */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">System Optimal</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lagos HQ</span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-100" />

        {/* Global Action Trigger */}
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Quick Action
          <div className="w-px h-3 bg-white/20 mx-1" />
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </header>
  );
};

export default Header;
