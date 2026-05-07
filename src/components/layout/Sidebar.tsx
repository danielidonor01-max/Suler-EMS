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
  Target,
  Command
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
    { name: 'Team', icon: Target, href: '/team' },
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
      className={`glass-surface h-full rounded-[24px] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        isCollapsed ? 'w-[88px]' : 'w-[280px]'
      }`}
    >
      {/* Brand Mark Layer */}
      <div className={`p-8 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
            <Box className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in">
              <span className="text-base font-black text-slate-900 tracking-tighter leading-none">Suler EMS</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Operational OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Rails */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pt-2">
        
        {/* Operations Layer */}
        <div className="space-y-1.5">
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
        </div>

        {/* Intelligence Layer */}
        <div className="space-y-1.5">
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
        </div>
      </div>

      {/* Utility Rail */}
      <div className="p-4 pt-6 mt-auto border-t border-slate-200/40">
        <SidebarLink 
          item={{ name: 'Settings', icon: Settings, href: '/settings' }} 
          isActive={pathname === '/settings'} 
          isCollapsed={isCollapsed} 
        />
        
        {/* Collapse Control */}
        <button 
          onClick={onToggle}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!isCollapsed && <span className="text-[13px] font-bold tracking-tight">Collapse View</span>}
        </button>

        <div className={`mt-4 p-3 rounded-xl bg-slate-50/50 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'border border-slate-100'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shrink-0">
            CO
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in">
              <div className="text-[12px] font-black text-slate-900 truncate tracking-tight">C. Okoro</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const SidebarLink = ({ item, isActive, isCollapsed }: any) => (
  <Link
    href={item.href}
    className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
      isActive 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    } ${isCollapsed ? 'justify-center h-[48px] w-[48px] mx-auto px-0' : ''}`}
  >
    <item.icon className={`w-[18px] h-[18px] transition-colors stroke-[1.5px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
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
