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
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/employees' },
    { name: 'Workforce', icon: Users, href: '/staff' },
    { name: 'Attendance', icon: Calendar, href: '/attendance' },
    { name: 'Governance', icon: ShieldCheck, href: '/governance' },
    { name: 'Workflows', icon: Activity, href: '/leave' },
    { name: 'Financials', icon: CreditCard, href: '/payroll' },
    { name: 'Compliance', icon: FileText, href: '/audit' },
  ];

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300">
      {/* Brand Workspace Identity */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Suler EMS</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Ops</span>
          </div>
        </div>
      </div>

      {/* Operational Rail Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Main Workspace</span>
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                <span className={`text-[13px] font-semibold ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              {!isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Executive Quick Actions */}
      <div className="p-6 border-t border-slate-50 space-y-6">
        <div className="flex items-center justify-between px-2">
          <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User Workspace Profile */}
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3.5 border border-slate-100/50">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold border border-slate-100">
            CO
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-slate-900 truncate">Chinedu Okoro</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Super Admin</div>
          </div>
          <button className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
