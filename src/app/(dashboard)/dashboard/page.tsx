"use client";

import React from 'react';
import { useAccess } from '@/context/AccessContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useSession } from 'next-auth/react';
import { Activity, Bell, Calendar, CheckSquare, Target, MessageSquare, TrendingUp, Users, ShieldCheck, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const { userRole } = useAccess();
  const { metrics } = useWorkforce();
  const { data: session } = useSession();

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isHRAdmin = userRole === 'HR_ADMIN';
  const isManager = userRole === 'MANAGER';

  // Personal Widgets (Visible to everyone)
  const renderPersonalWidgets = () => (
    <div className="space-y-4">
      <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">My Personal Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-[12px] flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Due</p>
            <p className="text-xl font-bold text-slate-900">2</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-[12px] flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Balance</p>
            <p className="text-xl font-bold text-slate-900">18 days</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-[12px] flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Status</p>
            <p className="text-xl font-bold text-slate-900">On Time</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-[12px] flex items-center justify-center text-amber-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unread Messages</p>
            <p className="text-xl font-bold text-slate-900">3</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Administrative Widgets
  const renderAdministrativeWidgets = () => {
    if (!isSuperAdmin && !isHRAdmin && !isManager) return null;

    return (
      <div className="space-y-4 mt-8 pt-8 border-t border-slate-200">
        <h2 className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">
          {isSuperAdmin ? 'Enterprise Intelligence' : isHRAdmin ? 'Workforce Operations' : 'Team Overview'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[20px] shadow-premium flex flex-col justify-between h-[140px]">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Employees</p>
              <p className="text-2xl font-bold text-white tracking-tight">{metrics.totalEmployees.toLocaleString()}</p>
            </div>
          </div>
          
          {(isSuperAdmin || isManager) && (
            <div className="p-6 bg-white border border-slate-200 rounded-[20px] shadow-sm flex flex-col justify-between h-[140px]">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">12</p>
              </div>
            </div>
          )}

          {(isSuperAdmin || isHRAdmin) && (
            <div className="p-6 bg-white border border-slate-200 rounded-[20px] shadow-sm flex flex-col justify-between h-[140px]">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Alerts</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">4</p>
              </div>
            </div>
          )}

          {isSuperAdmin && (
            <div className="p-6 bg-white border border-slate-200 rounded-[20px] shadow-sm flex flex-col justify-between h-[140px]">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Payroll</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">₦225M</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 text-[14px] mt-1">Here is what's happening today.</p>
        </div>

        {renderPersonalWidgets()}
        {renderAdministrativeWidgets()}

      </div>
    </div>
  );
}
