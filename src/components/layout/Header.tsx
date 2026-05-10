'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Command, 
  Plus, 
  ChevronDown,
  ShieldCheck,
  Activity,
  Globe,
  PlusCircle,
  Menu
} from 'lucide-react';
import { GlobalCommandModal } from '../modals/GlobalCommandModal';

import { useActivity } from '@/context/ActivityContext';
import { useAccess } from '@/context/AccessContext';
import { useOrganization } from '@/context/OrganizationContext';

const Header = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const { presenceCount } = useActivity();
  const { userRole } = useAccess();
  const { currentHub, hubs } = useOrganization();

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      
      {/* Left: Workspace & Search Command */}
      <div className="flex items-center gap-4 md:gap-8 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-4 border-r border-slate-100 pr-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
             S
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Organization</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-slate-900 tracking-tight leading-none">Suler Global</span>
            </div>
          </div>
        </div>

        <div className={`hidden lg:flex items-center gap-3 min-w-[180px] ${hubs.length > 1 ? 'cursor-pointer group' : ''}`}>
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 text-[10px] font-bold group-hover:bg-slate-200 transition-colors">
            {currentHub[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Office Hub</span>
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-bold text-slate-600 tracking-tight leading-none whitespace-nowrap">{currentHub}</span>
              {hubs.length > 1 && (
                <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:relative lg:max-w-[360px] lg:w-full lg:group lg:flex lg:items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-slate-900" />
          <input 
            type="text" 
            placeholder="Search operational data..." 
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-200 focus:bg-white rounded-[12px] py-2.5 pl-12 pr-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">
             <Command className="w-2.5 h-2.5" />
             K
          </div>
        </div>
      </div>

      {/* Right: Quick Actions & Notifications */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="hidden md:flex items-center gap-3 mr-4 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-[12px]">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">
             {userRole.replace('_', ' ')}
           </span>
        </div>

        <button 
          onClick={() => setIsCommandModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-[12px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group relative"
          title="Quick Action (Ctrl+K)"
        >
          <PlusCircle className="w-[18px] h-[18px] stroke-[1.5px]" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-premium">
            Quick Actions
          </div>
        </button>

        <div className="flex items-center gap-1.5">
           <button className="relative w-10 h-10 flex items-center justify-center rounded-[12px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <Bell className="w-[18px] h-[18px] stroke-[1.5px]" />
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-600 rounded-full border-2 border-white" />
          </button>
          
          <div className="w-10 h-10 rounded-[12px] bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-[11px] cursor-pointer hover:scale-105 transition-all shadow-premium">
            CO
          </div>
        </div>
      </div>

      <GlobalCommandModal isOpen={isCommandModalOpen} onClose={() => setIsCommandModalOpen(false)} />
    </header>
  );
};

export default Header;
