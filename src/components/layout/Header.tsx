'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  Bell,
  Command,
  ChevronDown,
  Activity,
  Globe,
  PlusCircle,
  Menu,
  UserCircle,
  Wallet,
  CheckSquare,
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react';
import { GlobalCommandModal } from '../modals/GlobalCommandModal';

import { useAccess } from '@/context/AccessContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useCommunication } from '@/context/CommunicationContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useRouter } from 'next/navigation';
import { useDismiss } from '@/lib/hooks/use-dismiss';

const Header = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { userRole } = useAccess();
  const { currentHub, hubs, switchHub } = useOrganization();
  const { conversations } = useCommunication();
  const { prefs } = usePreferences();
  const router = useRouter();
  const { data: session } = useSession();

  const hubRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  useDismiss(hubRef, () => setIsHubOpen(false), isHubOpen);
  useDismiss(profileRef, () => setIsProfileOpen(false), isProfileOpen);

  const handleSignOut = async () => {
    // signOut(redirect:false) clears the cookie server-side and returns
    // without navigating. We then hard-navigate to /login ourselves —
    // reliable regardless of NextAuth's `data.url` resolution.
    try {
      await signOut({ redirect: false });
    } finally {
      window.location.href = '/login';
    }
  };

  const rawUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  // Respect the per-user "Unread badge counter" preference.
  const totalUnread = prefs.messageBadge ? rawUnread : 0;

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">

      {/* Left: Workspace & Search Command */}
      <div className="flex items-center gap-4 md:gap-8 flex-1">
        <button
          type="button"
          aria-label="Toggle sidebar"
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

        <div className="hidden lg:flex items-center gap-3 min-w-[200px] relative">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 text-[10px] font-bold transition-colors">
            {currentHub[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Operational Hub</span>
            <div className="flex items-center gap-1">
              {userRole === 'SUPER_ADMIN' ? (
                <div className="relative" ref={hubRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={Boolean(isHubOpen)}
                    aria-label="Switch operational hub"
                    onClick={() => setIsHubOpen((v) => !v)}
                    className="flex items-center gap-1 text-[12px] font-bold text-slate-600 tracking-tight leading-none whitespace-nowrap hover:text-indigo-600 transition-colors"
                  >
                    {currentHub}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isHubOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isHubOpen && (
                    <div
                      role="menu"
                      className="absolute top-full left-0 mt-3 w-[220px] bg-white border border-slate-200 rounded-[20px] shadow-premium p-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                       <div className="px-3 py-2 border-b border-slate-50 mb-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Operational Context</span>
                       </div>
                       <div className="space-y-0.5">
                          {hubs.map((hub) => (
                            <button
                              type="button"
                              key={hub.id}
                              role="menuitem"
                              onClick={() => { switchHub(hub.id); setIsHubOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                currentHub === hub.name ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                               <Globe className={`w-3.5 h-3.5 ${currentHub === hub.name ? 'text-indigo-500' : 'text-slate-400'}`} />
                               <div className="flex flex-col items-start">
                                  <span className="text-[12px] font-bold leading-none mb-1">{hub.name}</span>
                                  <span className="text-[9px] font-medium opacity-60 leading-none">{hub.category}</span>
                               </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => { switchHub('HUB-00'); setIsHubOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border-t border-slate-50 mt-1 ${
                              currentHub === 'All Regions' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400'
                            }`}
                          >
                             <Activity className={`w-3.5 h-3.5 ${currentHub === 'All Regions' ? 'text-indigo-500' : 'text-slate-400'}`} />
                             <span className="text-[11px] font-bold">All Regions View</span>
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[12px] font-bold text-slate-600 tracking-tight leading-none whitespace-nowrap">{currentHub}</span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:relative lg:max-w-[360px] lg:w-full lg:group lg:flex lg:items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-slate-900" />
          <input
            type="text"
            aria-label="Search operational data"
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
          type="button"
          onClick={() => setIsCommandModalOpen(true)}
          aria-label="Open quick actions"
          className="w-10 h-10 flex items-center justify-center rounded-[12px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all group relative"
          title="Quick Action (Ctrl+K)"
        >
          <PlusCircle className="w-[18px] h-[18px] stroke-[1.5px]" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-premium">
            Quick Actions
          </div>
        </button>

        <div className="flex items-center gap-1.5">
           <button
             type="button"
             aria-label={`Messages${totalUnread > 0 ? ` (${totalUnread} unread)` : ''}`}
             onClick={() => router.push('/messages')}
             className="relative w-10 h-10 flex items-center justify-center rounded-[12px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
           >
            <MessageSquare className="w-[18px] h-[18px] stroke-[1.5px]" />
            {totalUnread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                aria-hidden="true"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          <button
             type="button"
             aria-label="Notifications"
             onClick={() => router.push('/notifications')}
             className="relative w-10 h-10 flex items-center justify-center rounded-[12px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
           >
            <Bell className="w-[18px] h-[18px] stroke-[1.5px]" />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={Boolean(isProfileOpen)}
              aria-label="Open user menu"
              onClick={() => setIsProfileOpen((v) => !v)}
              className="w-10 h-10 rounded-[12px] bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-[11px] cursor-pointer hover:scale-105 transition-all shadow-premium"
            >
              {(session?.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 mt-3 w-[240px] bg-white border border-slate-200 rounded-[20px] shadow-premium p-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                 <div className="px-3 py-3 border-b border-slate-50 mb-1 flex flex-col">
                    <span className="text-[13px] font-bold text-slate-900 truncate">{session?.user?.name || 'User'}</span>
                    <span className="text-[10px] font-medium text-slate-400 truncate">{session?.user?.email || 'user@suler.com'}</span>
                 </div>
                 <div className="space-y-0.5">
                    <Link href="/profile" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600">
                       <UserCircle className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">My Profile</span>
                    </Link>
                    <Link href="/my-payroll" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600">
                       <Wallet className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">My Payslips</span>
                    </Link>
                    <Link href="/leave" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600">
                       <Activity className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">My Leave Requests</span>
                    </Link>
                    <Link href="/tasks" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600">
                       <CheckSquare className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">My Tasks</span>
                    </Link>
                    <Link href="/messages" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600">
                       <MessageSquare className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">Messages</span>
                    </Link>
                    <Link href="/preferences" role="menuitem" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50 text-slate-600 border-b border-slate-50 pb-3 mb-1">
                       <Settings className="w-4 h-4 text-slate-400" />
                       <span className="text-[12px] font-bold">My Preferences</span>
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setIsProfileOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-rose-50 text-rose-600 mt-1"
                    >
                       <LogOut className="w-4 h-4 text-rose-500" />
                       <span className="text-[12px] font-bold">Sign Out</span>
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <GlobalCommandModal isOpen={isCommandModalOpen} onClose={() => setIsCommandModalOpen(false)} />
    </header>
  );
};

export default Header;
