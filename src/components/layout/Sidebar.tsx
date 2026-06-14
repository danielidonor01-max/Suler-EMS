"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { Modal } from '@/components/common/Modal';
import { 
  Building2, 
  Users, 
  UserCircle,
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
  Award,
  Send,
  AlertTriangle,
  LayoutDashboard,
  CheckSquare
} from 'lucide-react';
import { useAccess } from '@/context/AccessContext';
import { Permissions } from '@/modules/auth/domain/permission.model';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  const { checkPermission, userRole, user } = useAccess();
  const { data: session } = useSession();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Write audit event before destroying session
      await fetch('/api/system/security-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SESSION_EXPIRED',
          description: `[SIGN_OUT] ${session?.user?.name || 'User'} (${userRole}) signed out successfully.`,
          metadata: { role: userRole, initiatedBy: 'USER_ACTION' },
        }),
      }).catch(() => { /* non-blocking — don't block logout if audit fails */ });
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

  // My Workspace (Universal, Visible to all)
  const personalModules = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'My Profile', icon: UserCircle, href: '/profile' },
    { name: 'Messages', icon: MessageSquare, href: '/messages' },
    { name: 'Notifications', icon: Bell, href: '/notifications' },
    { name: 'My Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Attendance', icon: Calendar, href: '/attendance' },
    { name: 'Leave Requests', icon: Activity, href: '/leave' },
    { name: 'My Payroll', icon: Wallet, href: '/my-payroll' },
    { name: 'Request Tracker', icon: TrendingUp, href: '/tracker' },
  ];

  // Administrative Workspace (Permission-based)
  const operationsModules = [
    { name: 'Workforce Registry', icon: Building2, href: '/workforce', permission: Permissions.WORKFORCE_VIEW },
    { name: 'Team Management', icon: Users, href: '/team', permission: Permissions.WORKFORCE_VIEW },
    { name: 'Attendance Admin', icon: Calendar, href: '/attendance/admin', permission: Permissions.ATTENDANCE_VIEW },
    { name: 'Leave Admin', icon: Activity, href: '/leave/admin', permission: Permissions.LEAVE_VIEW },
  ].filter(m => !m.permission || checkPermission(m.permission as any).allowed);

  const accountsFinanceModules = [
    { name: 'Payroll Admin', icon: Wallet, href: '/payroll', permission: Permissions.PAYROLL_VIEW },
    { name: 'Finance', icon: DollarSign, href: '/finance', permission: Permissions.FINANCE_VIEW },
  ].filter(m => !m.permission || checkPermission(m.permission as any).allowed);

  const governanceModules = [
    { name: 'Command Center', icon: Cpu, href: '/admin/ecc', permission: Permissions.COMMAND_CENTER_VIEW },
    { name: 'Roles & Permissions', icon: ShieldCheck, href: '/admin/roles', permission: Permissions.ROLE_MANAGE },
    { name: 'Audit Registry', icon: History, href: '/governance', permission: Permissions.AUDIT_VIEW },
  ].filter(m => !m.permission || checkPermission(m.permission as any).allowed);

  const settingSubModules = [
    { name: 'Compliance & Tax', href: '/settings/compliance', permission: Permissions.SETTINGS_MANAGE },
    { name: 'Security', href: '/settings/security', permission: Permissions.SECURITY_MANAGE },
    { name: 'Integrations', href: '/settings/integrations', permission: Permissions.SECURITY_MANAGE },
    { name: 'Data Management', href: '/settings/data', permission: Permissions.DATA_MANAGE },
  ].filter(m => !m.permission || checkPermission(m.permission as any).allowed);

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
        
        {/* My Workspace Layer */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">My Workspace</span>
            </div>
          )}
          <div className="space-y-1">
            {personalModules.map((item) => (
              <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>

        {/* Operations Layer */}
        {operationsModules.length > 0 && (
          <div className="space-y-1 mt-6">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Operations</span>
              </div>
            )}
            <div className="space-y-1">
              {operationsModules.map((item) => (
                <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        )}

        {/* Accounts & Finance Layer */}
        {accountsFinanceModules.length > 0 && (
          <div className="space-y-1 mt-6">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Accounts & Finance</span>
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
        {governanceModules.length > 0 && (
          <div className="space-y-1 mt-6">
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Governance</span>
              </div>
            )}
            <div className="space-y-1">
              {governanceModules.map((item) => (
                <SidebarLink key={item.name} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        )}

        {/* System Control Layer */}
        {checkPermission(Permissions.SETTINGS_MANAGE).allowed && (
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
              onClick={() => setShowSignOutModal(true)}
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

      {/* ─── Sign Out Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => !isSigningOut && setShowSignOutModal(false)}
        title="Confirm Sign Out"
        subtitle="Session Termination"
        size="sm"
      >
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Warning */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-[20px] bg-rose-50 flex items-center justify-center border-2 border-rose-100">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">End your session?</h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[300px]">
                You are about to terminate your operational session. Any unsaved changes may be lost.
              </p>
            </div>
          </div>

          {/* Active Identity Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Currently signed in as</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {(session?.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-slate-900 truncate">{session?.user?.name || 'User'}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-md border border-indigo-100">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full h-[52px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              {isSigningOut ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isSigningOut ? 'Terminating Session...' : 'Sign Out'}
            </button>
            <button
              onClick={() => setShowSignOutModal(false)}
              disabled={isSigningOut}
              className="w-full h-[48px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel — Stay in Session
            </button>
          </div>

        </div>
      </Modal>

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
