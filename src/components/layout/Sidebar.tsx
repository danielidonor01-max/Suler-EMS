'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Bell,
  Activity,
  Box
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Hub', icon: LayoutDashboard, href: '/employees' },
    { name: 'Workforce', icon: Users, href: '/staff' },
    { name: 'Attendance', icon: Calendar, href: '/attendance' },
    { name: 'Governance', icon: ShieldCheck, href: '/governance' },
    { name: 'Workflows', icon: Activity, href: '/leave' },
    { name: 'Financials', icon: CreditCard, href: '/payroll' },
  ];

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300">
      {/* Premium Workspace Identity */}
      <div className="p-10 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
            <Box className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 tracking-tight leading-none">Suler</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Ops OS</span>
          </div>
        </div>
      </div>

      {/* Nav Rail (Inspired by Tidio Inbox) */}
      <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="mb-6 px-4">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Operational Hub</span>
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-300 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5.5 h-5.5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-600'} transition-colors`} />
              <span className={`text-[14px] font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* System Quick Actions */}
      <div className="p-8 space-y-8">
        <div className="bg-slate-50/50 rounded-[28px] p-2 flex items-center justify-around border border-slate-100/50">
          <button className="relative p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full shadow-sm" />
          </button>
          <div className="w-px h-6 bg-slate-200/50" />
          <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User Intelligence Profile */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-sm">
            CO
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold text-slate-900 truncate tracking-tight">Chinedu Okoro</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Principal Admin</div>
          </div>
          <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
