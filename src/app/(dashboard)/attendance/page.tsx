"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Filter, 
  Download,
  Fingerprint,
  Zap,
  Activity
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';

// Initial Mock Data
const MOCK_ATTENDANCE = [
  { id: 'att-001', staffName: 'Chinedu Okoro', checkIn: '08:00 AM', status: 'ON_TIME', department: 'Executive' },
  { id: 'att-002', staffName: 'Sarah Williams', checkIn: '08:15 AM', status: 'LATE', department: 'Operations' },
  { id: 'att-003', staffName: 'David Okafor', checkIn: '07:55 AM', status: 'ON_TIME', department: 'Finance' },
  { id: 'att-004', staffName: 'Blessing Udoh', checkIn: '09:00 AM', status: 'LATE', department: 'HR' },
  { id: 'att-005', staffName: 'John Doe', checkIn: '08:05 AM', status: 'ON_TIME', department: 'Engineering' },
];

export default function AttendancePage() {
  const [data] = useState(MOCK_ATTENDANCE);

  const columns = [
    {
      header: "Staff Member",
      accessor: "staffName",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[14px] font-black text-slate-900 tracking-tight">{val}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-0.5">{row.department}</div>
        </div>
      )
    },
    {
      header: "Log Time",
      accessor: "checkIn",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-600">{val}</span>
        </div>
      )
    },
    {
      header: "Registry Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          val === 'ON_TIME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${val === 'ON_TIME' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{val.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      header: "Control",
      accessor: "id",
      render: () => (
        <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all">
          Details
        </button>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      {/* Executive Hero */}
      <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3" />
                Biometric Sync Active
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              Attendance & Presence
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Real-time monitoring of workforce presence, punctuality trends, and automated biometric reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border border-slate-100">
              <Download className="w-4 h-4" />
              Export Logs
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100">
              <RefreshCcw className="w-4 h-4" />
              Reconcile Devices
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Present Today" 
          value="1,156" 
          trend={{ value: 4.2, isPositive: true }}
          variant="tonal-success"
          icon="check_circle"
        />
        <MetricCard 
          label="Late Arrivals" 
          value="12" 
          trend={{ value: 2.1, isPositive: false }}
          variant="tonal-warning"
          icon="history"
        />
        <MetricCard 
          label="Remote Sync" 
          value="42" 
          variant="tonal-info"
          icon="wifi"
        />
        <MetricCard 
          label="System Health" 
          value="Optimal" 
          variant="tonal-success"
          icon="memory"
        />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Presence Registry"
        description="Consolidated log of biometric check-ins and operational presence signals."
        data={data}
        columns={columns}
      />
    </div>
  );
}
