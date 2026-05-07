'use client';

import React from 'react';
import { 
  Plus, 
  ChevronDown, 
  Command,
  Bell,
  Zap,
  Activity,
  Layers,
  SearchIcon,
  ShieldCheck
} from 'lucide-react';

const Header = () => {
  return (
    <header className="h-[80px] bg-white rounded-[20px] border border-slate-200/60 shadow-sm px-8 flex items-center justify-between shrink-0 relative transition-all duration-300">
      
      {/* Left: Global Workspace & Search */}
      <div className="flex items-center gap-8 flex-1">
        {/* Workspace Selector - More Mature/Modest */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl group cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-900 leading-none flex items-center gap-2">
              Lagos HQ
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Workspace</span>
          </div>
        </div>

        {/* Global Command Search - Tighter, Professional */}
        <div className="flex-1 max-w-[420px] group relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, workflows, entities..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-16 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
            <Command className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">K</span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-6">
        
        {/* System Health Indicators */}
        <div className="hidden lg:flex items-center gap-4 border-r border-slate-100 pr-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">Systems Optimal</span>
          </div>
          
          <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
             <ShieldCheck className="w-3 h-3" />
             <span className="text-[9px] font-black uppercase tracking-widest">Secure</span>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-3">
          {/* Notifications Center */}
          <button className="relative w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full shadow-sm" />
          </button>

          {/* Mature Quick Action */}
          <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]">
            <Plus className="w-4 h-4" />
            Action
            <div className="w-px h-3 bg-white/20 mx-1" />
            <ChevronDown className="w-3.5 h-3.5 opacity-40" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
