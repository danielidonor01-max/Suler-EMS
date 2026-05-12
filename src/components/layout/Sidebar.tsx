"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
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
  Banknote,
  Wallet,
  DollarSign,
  History,
  Lock,
  BarChart3,
  Sparkles,
  Database,
  Bell,
  FileBarChart2,
  Cpu,
  Award
} from 'lucide-react';
import { useAccess } from '@/context/AccessContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  const { userRole } = useAccess();

  const operationsModules = [
    { name: 'Hub', icon: Building2, href: '/employees' },
    { name: 'Workforce', icon: Users, href: '/staff' },
    { name: 'Team', icon: Target, href: '/team' },
    { name: 'Attendance', icon: Calendar, href: '/attendance' },
    { name: 'Leave', icon: Activity, href: '/leave' },
    { name: 'Workflows', icon: MessageSquare, href: '/communication' },
  ];

  const accountsFinanceModules = [
    { name: 'Payroll', icon: Wallet, href: '/payroll' },
    { name: 'Finance', icon: DollarSign, href: '/finance' },
  ];

  const governanceModules = [
    { name: 'Command Center', icon: Cpu, href: '/admin/ecc' },
    { name: 'Roles & Permissions', icon: ShieldCheck, href: '/admin/ecc' },
    { name: 'Audit Registry', icon: History, href: '/governance' },
  ];

  const intelligenceModules = [
    { name: 'Performance', icon: Award, href: '/performance' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Reports', icon: FileBarChart2, href: '/reports' },
    { name: 'Strategy Simulator', icon: Sparkles, href: '/admin/intelligence' },
  ];

  const settingSubModules = [
    { name: 'Compliance & Tax', href: '/settings/compliance' },
    { name: 'Security', href: '/settings/security' },
    { name: 'Integrations', href: '/settings/integrations' },
    { name: 'Data Management', href: '/settings/data' },
  ];

  const notificationsModule = { name: 'Notifications', icon: Bell, href: '/notifications' };

  return (
    <aside 
      className={`bg-slate-900 h-screen border-r border-slate-800 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] relative z-50 ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
    >
      {/* Brand Mark Layer */}
      <div className={`h-[72px] flex items-center px-6 border-b border-slate-800`}>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Box className="w-5 h-5 stroke-[1.5px]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in slide-in-from-left-2">
              <span className="text-sm font-bold text-white tracking-tight leading-none">Suler EMS</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Operating System</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Rails */}
      <div className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar pt-6 pb-8">
        
        {/* Operations Layer */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operations</span>
            </div>
          )}
          <div className="space-y-1">
            {operationsModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* Accounts & Finance Layer */}
        {(userRole !== 'EMPLOYEE') && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Accounts & Finance</span>
              </div>
            )}
            <div className="space-y-1">
              {accountsFinanceModules.map((item) => (
                <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        )}

        {/* Governance Layer */}
        {(userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN') && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Governance</span>
              </div>
            )}
            <div className="space-y-1">
              {governanceModules.map((item) => (
                <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        )}

        {/* Intelligence Layer */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Intelligence</span>
            </div>
          )}
          <div className="space-y-1">
            {intelligenceModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* Notifications Link */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Alerts</span>
            </div>
          )}
          <SidebarLink item={notificationsModule} isActive={pathname === notificationsModule.href} isCollapsed={isCollapsed} />
        </div>

        {/* System Control Layer */}
        {userRole === 'SUPER_ADMIN' && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">System Control</span>
              </div>
            )}
            
            <div className="space-y-1">
               <SidebarLink 
                 item={{ name: 'Global Settings', icon: Settings, href: '/settings' }} 
                 isActive={pathname === '/settings'} 
                 isCollapsed={isCollapsed} 
               />
               {!isCollapsed && settingSubModules.map(item => (
                 <Link 
                   key={item.name}
                   href={item.href}
                   className={`flex items-center gap-3.5 px-4 py-2 rounded-xl transition-all ${pathname === item.href ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />
                    <span className="text-[11px] font-bold tracking-tight uppercase">{item.name}</span>
                 </Link>
               ))}
            </div>
          </div>
        )}

        {/* Session Layer */}
        <div className="space-y-1 pt-4 border-t border-slate-800">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Session</span>
            </div>
          )}
          <button
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 w-full ${isCollapsed ? 'justify-center h-[44px] w-[44px] mx-auto px-0' : ''}`}
          >
            <LogOut className={`w-[18px] h-[18px] stroke-[1.5px] ${isCollapsed ? 'text-rose-400' : ''}`} />
            {!isCollapsed && (
              <span className="text-[13px] font-bold tracking-tight">
                Sign Out
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Edge-Mounted Collapse Trigger */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-[88px] w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all shadow-premium z-[60]"
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
        ? 'bg-indigo-600 text-white shadow-premium' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${isCollapsed ? 'justify-center h-[44px] w-[44px] mx-auto px-0' : ''}`}
  >
    <item.icon className={`w-[18px] h-[18px] transition-colors stroke-[1.5px] ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
    {!isCollapsed && (
      <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
        {item.name}
      </span>
    )}
    
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-premium">
        {item.name}
      </div>
    )}
  </Link>
);

export default Sidebar;
