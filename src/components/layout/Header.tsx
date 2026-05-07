'use client';

import React from 'react';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  Globe,
  Command,
  Bell,
  Zap,
  Activity,
  Layers,
  SearchIcon
} from 'lucide-react';

const Header = () => {
  return (
    <header className="h-[88px] bg-white rounded-[28px] border border-slate-100 shadow-premium px-8 flex items-center justify-between shrink-0 relative overflow-hidden transition-all duration-500">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 blur-3xl rounded-full -mr-16 -mt-16" />

      {/* Left: Global Workspace & Search */}
      <div className="flex items-center gap-10 flex-1">
        {/* Workspace Selector */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-[18px] group cursor-pointer hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Workspace</span>
            <span className="text-[12px] font-black text-slate-900 leading-none flex items-center gap-2">
              Lagos HQ
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </span>
          </div>
        </div>

        {/* Global Command Search */}
        <div className="flex-1 max-w-[440px] group relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, workflows..." 
            className="w-full bg-slate-50/50 border border-slate-100 rounded-[18px] py-3 pl-12 pr-16 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-300 transition-all font-bold"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
            <Command className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-black text-slate-400">K</span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-6">
        
        {/* System Status Indicators */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/50 border border-emerald-100/50 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.2em]">Live</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 border border-slate-100 rounded-full">
            <Activity className="w-3 h-3 text-slate-300" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Opt-42</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-100" />

        {/* Action Center */}
        <div className="flex items-center gap-3">
          {/* Notifications Center */}
          <button className="relative w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all shadow-sm group">
            <Bell className="w-5.5 h-5.5" />
            <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 border-2 border-white rounded-full shadow-sm group-hover:scale-110 transition-transform" />
          </button>

          {/* Refined Quick Action */}
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-6 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-100 active:scale-[0.98] border border-indigo-500/20">
            <Zap className="w-4 h-4 fill-white/20" />
            Action
            <ChevronDown className="w-3.5 h-3.5 opacity-40 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
