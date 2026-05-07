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
  MoreVertical
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
      className={`relative h-full bg-white border border-slate-100 rounded-[32px] shadow-premium flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed ? 'w-[100px]' : 'w-[300px]'
      }`}
    >
      {/* Collapse Toggle Control */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm z-50 transition-all hover:scale-110"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Premium Workspace Identity */}
      <div className={`p-8 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
            <Box className="w-7 h-7" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none">Suler</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Ops OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Rail */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar mt-4">
        
        {/* Primary Navigation */}
        <section className="space-y-2">
          {!isCollapsed && (
            <div className="px-4 mb-4">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Registry Hub</span>
            </div>
          )}
          <div className="space-y-1">
            {primaryModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </section>

        {/* Secondary Intelligence */}
        <section className="space-y-2">
          {!isCollapsed && (
            <div className="px-4 mb-4">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Intelligence</span>
            </div>
          )}
          <div className="space-y-1">
            {secondaryTools.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </section>

        {/* System Settings (Bottom aligned) */}
        <section className="pt-4 border-t border-slate-50">
           <SidebarLink 
            item={{ name: 'Settings', icon: Settings, href: '/settings' }} 
            isActive={pathname === '/settings'} 
            isCollapsed={isCollapsed} 
          />
        </section>
      </div>

      {/* Profile Section */}
      <div className={`p-6 border-t border-slate-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-4 bg-slate-50/50 p-3 rounded-[24px] border border-slate-100/50 ${isCollapsed ? 'p-1 bg-transparent border-none' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
            CO
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in">
              <div className="text-[12px] font-black text-slate-900 truncate tracking-tight">Chinedu Okoro</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Principal Admin</div>
            </div>
          )}
          {!isCollapsed && (
            <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
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
    className={`group flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-300 relative ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100/30' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    } ${isCollapsed ? 'px-0 justify-center h-[56px] w-[56px] mx-auto' : ''}`}
  >
    <item.icon className={`w-5.5 h-5.5 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'}`} />
    {!isCollapsed && (
      <span className={`text-[14px] font-bold tracking-tight animate-in ${isActive ? 'text-white' : ''}`}>
        {item.name}
      </span>
    )}
    
    {/* Collapsed Tooltip Placeholder */}
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-[100] whitespace-nowrap">
        {item.name}
      </div>
    )}
  </Link>
);

export default Sidebar;
