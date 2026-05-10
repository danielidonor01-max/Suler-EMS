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
  PanelLeftClose,
  PanelLeft
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
      className={`bg-white h-screen border-r border-slate-200 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] relative z-50 ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
    >
      {/* Brand Mark Layer */}
      <div className={`h-[72px] flex items-center px-6 border-b border-slate-200`}>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Box className="w-5 h-5 stroke-[1.5px]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in slide-in-from-left-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-none">Suler EMS</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suler Operational OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Rails */}
      <div className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar pt-6">
        
        {/* Operations Layer */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Operations</span>
            </div>
          )}
          <div className="space-y-1">
            {primaryModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* Intelligence Layer */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Intelligence</span>
            </div>
          )}
          <div className="space-y-1">
            {secondaryTools.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>
      </div>

      {/* Utility Rail: Executive Minimalism */}
      <div className={`px-4 pb-8 space-y-4`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <Link
            href="/settings"
            className={`flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all ${isCollapsed ? '' : 'flex-1 border border-transparent hover:border-slate-200'}`}
          >
            <Settings className="w-[18px] h-[18px] stroke-[1.5px]" />
            {!isCollapsed && <span className="ml-3 text-[12px] font-bold tracking-tight">Settings</span>}
          </Link>

          <button
            className={`flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all ${isCollapsed ? '' : 'flex-1 border border-transparent hover:border-rose-100/50'}`}
          >
            <LogOut className="w-[18px] h-[18px] stroke-[1.5px]" />
            {!isCollapsed && <span className="ml-3 text-[12px] font-bold tracking-tight">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Edge-Mounted Collapse Trigger */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-[88px] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm z-[60]"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
};

const SidebarLink = ({ item, isActive, isCollapsed }: any) => (
  <Link
    href={item.href}
    className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 relative ${
      isActive 
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    } ${isCollapsed ? 'justify-center h-[44px] w-[44px] mx-auto px-0' : ''}`}
  >
    <item.icon className={`w-[18px] h-[18px] transition-colors stroke-[1.5px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
    {!isCollapsed && (
      <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
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
