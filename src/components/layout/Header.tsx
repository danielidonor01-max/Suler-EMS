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
  Globe,
  PlusCircle
} from 'lucide-react';

const Header = () => {
  return (
    <header className="h-[72px] bg-white border-b border-slate-200/50 flex items-center justify-between px-8 sticky top-0 z-40">
      
      {/* Left: Workspace & Search Command */}
      <div className="flex items-center gap-10 flex-1">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black group-hover:scale-105 transition-transform">L</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-black text-slate-900 tracking-tight">Lagos HQ</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
        </div>

        <div className="relative max-w-[360px] w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-slate-900" />
          <input 
            type="text" 
            placeholder="Search operational data..." 
            className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 focus:bg-white rounded-xl py-2.5 pl-12 pr-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400">
             <Command className="w-2.5 h-2.5" />
             K
          </div>
        </div>
      </div>

      {/* Center: System Intelligence Indicators (Thinner, Quieter) */}
      <div className="hidden lg:flex items-center gap-8 border-x border-slate-100 px-10 h-full">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync: 12ms</span>
        </div>
      </div>

      {/* Right: Quick Actions & Notifications */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm">
          <PlusCircle className="w-4 h-4" />
          Quick Action
        </button>

        <div className="flex items-center gap-1.5">
           <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <Bell className="w-[18px] h-[18px] stroke-[1.5px]" />
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-600 rounded-full border-2 border-white" />
          </button>
          
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-[10px] cursor-pointer hover:border-slate-200 transition-all">
            CO
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
