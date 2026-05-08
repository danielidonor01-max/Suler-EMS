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
  PanelLeft,
  Globe,
  UserPlus,
  History,
  Megaphone
} from 'lucide-react';
import { useAccess } from '@/context/AccessContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  
  const { userRole } = useAccess(); 

  const globalRails = [
    { name: 'Command Center', icon: LayoutDashboard, href: '/admin/ecc', roles: ['SUPER_ADMIN'] },
    { name: 'Communications', icon: MessageSquare, href: '/communication', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Broadcast Center', icon: Megaphone, href: '/admin/broadcast', roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { name: 'Workforce Intel', icon: BrainCircuit, href: '/admin/intelligence', roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { name: 'Global Analytics', icon: TrendingUp, href: '/analytics', roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
  ];

  const operationalRails = [
    { name: 'Workforce Hub', icon: Users, href: '/employees', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
    { name: 'Attendance', icon: Calendar, href: '/attendance', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Workflows', icon: Activity, href: '/leave', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Team Hub', icon: Target, href: '/team', roles: ['SUPER_ADMIN', 'MANAGER'] },
  ];

  const adminRails = [
    { name: 'Organization', icon: Globe, href: '/admin/organization', roles: ['SUPER_ADMIN'] },
    { name: 'IAM Console', icon: ShieldCheck, href: '/admin/iam', roles: ['SUPER_ADMIN'] },
    { name: 'Provisioning', icon: UserPlus, href: '/admin/provisioning', roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { name: 'Audit Logs', icon: History, href: '/admin/audit', roles: ['SUPER_ADMIN'] },
  ];

  const filterByRole = (items: any[]) => items.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300" 
          onClick={onToggle}
        />
      )}

      <aside 
        className={`bg-white h-screen border-r border-slate-200/60 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] fixed lg:relative z-50 ${
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-[80px]' : 'translate-x-0 w-[280px]'
        }`}
      >
      {/* Brand Mark Layer */}
      <div className={`h-[72px] flex items-center px-6 border-b border-slate-200/40`}>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Box className="w-5 h-5 stroke-[1.5px]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in slide-in-from-left-2">
              <span className="text-sm font-black text-slate-900 tracking-tight leading-none">Suler EMS</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Operational OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Rails */}
      <div className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar pt-6 pb-10">
        
        {/* GLOBAL Layer: Intelligence & Strategy */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Global Context</span>
            </div>
          )}
          <div className="space-y-1">
            {filterByRole(globalRails).map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* OPERATIONS Layer: Execution & Workforce */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Operations</span>
            </div>
          )}
          <div className="space-y-1">
            {filterByRole(operationalRails).map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* SYSTEM ADMINISTRATION: Governance & Trust */}
        {userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' ? (
          <div className="space-y-1 pt-4 border-t border-slate-100">
            {!isCollapsed && (
              <div className="px-4 mb-3 flex items-center justify-between">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">System Admin</span>
                <ShieldCheck className="w-3 h-3 text-indigo-300" />
              </div>
            )}
            <div className="space-y-1">
              {filterByRole(adminRails).map((item) => (
                <SidebarLink 
                  key={item.name} 
                  item={item} 
                  isActive={pathname === item.href} 
                  isCollapsed={isCollapsed} 
                  variant="admin"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Utility Rail: Executive Minimalism */}
      <div className={`px-4 pb-8 space-y-2`}>
        <div className="flex flex-col gap-2">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 h-[44px] rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 w-full ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Settings className="w-[18px] h-[18px] stroke-[1.5px] shrink-0" />
            {!isCollapsed && <span className="text-[12px] font-black tracking-tight">Settings</span>}
          </Link>

          <button
            className={`flex items-center gap-3 px-3 h-[44px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all border border-transparent hover:border-rose-100/50 w-full ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="w-[18px] h-[18px] stroke-[1.5px] shrink-0" />
            {!isCollapsed && <span className="text-[12px] font-black tracking-tight">Sign Out</span>}
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
    </>
  );
};

const SidebarLink = ({ item, isActive, isCollapsed, variant }: any) => {
  const isAdmin = variant === 'admin';
  
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 relative ${
        isActive 
          ? (isAdmin ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-900/10' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10') 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      } ${isCollapsed ? 'justify-center h-[44px] w-[44px] mx-auto px-0' : ''}`}
    >
      <item.icon className={`w-[18px] h-[18px] transition-colors stroke-[1.5px] ${
        isActive 
          ? 'text-white' 
          : (isAdmin ? 'text-slate-600 group-hover:text-indigo-600' : 'text-slate-400 group-hover:text-slate-900')
      }`} />
      {!isCollapsed && (
        <span className={`text-[13px] tracking-tight ${
          isActive ? 'font-black' : (isAdmin ? 'font-medium group-hover:font-black' : 'font-bold')
        }`}>
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
};

export default Sidebar;
