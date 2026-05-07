'use client';

import React from 'react';
import { 
  Search, 
  Bell, 
  Command, 
  Plus, 
  ChevronDown,
  ShieldCheck,
  Activity,
  Zap,
  Globe
} from 'lucide-react';

const Header = () => {
  return (
    <header className="h-[72px] flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[24px] shadow-sm animate-in transition-all">
      
      {/* Left: Workspace & Search Command */}
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[9px] font-black">L</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black text-slate-900 tracking-tight">Lagos HQ</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div className="relative max-w-[320px] w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-slate-900" />
          <input 
            type="text" 
            placeholder="Search operational data..." 
            className="w-full bg-slate-50/50 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl py-2.5 pl-11 pr-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400">
             <Command className="w-2.5 h-2.5" />
             K
          </div>
        </div>
      </div>

      {/* Center: System Intelligence Indicators */}
      <div className="hidden lg:flex items-center gap-6 px-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">8.4ms</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync</span>
        </div>
      </div>

      {/* Right: Quick Actions & Notifications */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95">
          <Plus className="w-4 h-4" />
          Operational Entry
        </button>

        <div className="h-8 w-px bg-slate-200/60" />

        <div className="flex items-center gap-2">
           <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <Bell className="w-[18px] h-[18px] stroke-[1.5px]" />
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-600 rounded-full border-2 border-white" />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] cursor-pointer hover:border-slate-200 transition-all">
            CO
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
