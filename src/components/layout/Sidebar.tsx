'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Box,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Settings,
  Target
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();

  const primaryModules = [
    { name: 'Hub', icon: LayoutDashboard, href: '/employees' },
    { name: 'Workforce', icon: Users, href: '/staff' },
    { name: 'Team', icon: Target, href: '/team' }, // Added Team for Managers
    { name: 'Attendance', icon: Calendar, href: '/attendance' },
    { name: 'Governance', icon: ShieldCheck, href: '/governance' },
    { name: 'Workflows', icon: Activity, href: '/leave' },
  ];

  const secondaryTools = [
    { name: 'Analytics', icon: TrendingUp, href: '/analytics' },
    { name: 'Forecasting', icon: BrainCircuit, href: '/forecasting' },
    { name: 'Communication', icon: MessageSquare, href: '/communication' },
  ];

  return (
    <aside 
      className={`relative h-full bg-white border border-slate-200/60 rounded-[20px] shadow-sm flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed ? 'w-[92px]' : 'w-[280px]'
      }`}
    >
      {/* Mature Collapse Toggle */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm z-50 transition-all"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Corporate Identity */}
      <div className={`p-7 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
            <Box className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in">
              <span className="text-base font-black text-slate-900 tracking-tighter leading-none">Suler EMS</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Operational Intelligence</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Rails */}
      <div className="flex-1 px-4 space-y-7 overflow-y-auto custom-scrollbar mt-2">
        
        {/* Primary Operations */}
        <section className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Operations</span>
            </div>
          )}
          <div className="space-y-1">
            {primaryModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </section>

        {/* Intelligence & Strategy */}
        <section className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Intelligence</span>
            </div>
          )}
          <div className="space-y-1">
            {secondaryTools.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </section>
      </div>

      {/* Utility & Profile */}
      <div className="p-4 space-y-1">
         <SidebarLink 
            item={{ name: 'Settings', icon: Settings, href: '/settings' }} 
            isActive={pathname === '/settings'} 
            isCollapsed={isCollapsed} 
          />
        
        <div className={`mt-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3 ${isCollapsed ? 'justify-center border-none bg-transparent' : ''}`}>
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[11px] font-black shrink-0">
            CO
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in">
              <div className="text-[12px] font-black text-slate-900 truncate tracking-tight">Chinedu Okoro</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Administrator</div>
            </div>
          )}
          {!isCollapsed && (
            <button className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

const SidebarLink = ({ item, isActive, isCollapsed }: any) => (
  <Link
    href={item.href}
    className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 relative ${
      isActive 
        ? 'bg-slate-900 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    } ${isCollapsed ? 'px-0 justify-center h-[48px] w-[48px] mx-auto' : ''}`}
  >
    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'}`} />
    {!isCollapsed && (
      <span className={`text-[13px] font-bold tracking-tight animate-in ${isActive ? 'text-white' : ''}`}>
        {item.name}
      </span>
    )}
    
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-xl">
        {item.name}
      </div>
    )}
  </Link>
);

export default Sidebar;
