"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Download,
  Terminal,
  History
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';

// Initial Mock Data
const MOCK_AUDIT_LOGS = [
  { id: 'log-001', actor: 'Chinedu Okoro', action: 'ROLE_UPDATE', target: 'Alex Okereke', status: 'SUCCESS', timestamp: '2024-05-01T10:00:00Z' },
  { id: 'log-002', actor: 'System Engine', action: 'POLICY_EVAL', target: 'Leave Workflow', status: 'SUCCESS', timestamp: '2024-05-01T10:05:00Z' },
  { id: 'log-003', actor: 'Sarah Williams', action: 'AUTH_ATTEMPT', target: 'Payroll System', status: 'DENIED', timestamp: '2024-05-01T10:10:00Z' },
  { id: 'log-004', actor: 'Chinedu Okoro', action: 'DATA_EXPORT', target: 'Staff Records', status: 'SUCCESS', timestamp: '2024-05-01T10:15:00Z' },
];

export default function GovernancePage() {
  const [data] = useState(MOCK_AUDIT_LOGS);

  const columns = [
    {
      header: "Actor",
      accessor: "actor",
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-[13px] font-black text-slate-900 tracking-tight">{val}</span>
        </div>
      )
    },
    {
      header: "Operation",
      accessor: "action",
      render: (val: string) => (
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{val.replace('_', ' ')}</span>
      )
    },
    {
      header: "Target Resource",
      accessor: "target",
      render: (val: string) => (
        <span className="text-[13px] font-bold text-slate-600">{val}</span>
      )
    },
    {
      header: "Execution",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
          val === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{val}</span>
        </div>
      )
    },
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (val: string) => (
        <span className="text-[12px] font-bold text-slate-400">{new Date(val).toLocaleTimeString()}</span>
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
              <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Zero Trust Architecture
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              System Governance
            </h1>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Immutable audit trails, granular role-based access control, and real-time security policy enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center gap-2.5 px-6 h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-100 shadow-sm">
              <History className="w-[18px] h-[18px] stroke-[1.5px]" />
              Policy History
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 px-8 h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100/20">
              <ShieldAlert className="w-[18px] h-[18px] stroke-[1.5px]" />
              Revoke Sessions
            </button>
          </div>
        </div>
        {/* Subtle geometric pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Audit Integrity" 
          value="100%" 
          variant="tonal-success"
          icon={ShieldCheck}
        />
        <MetricCard 
          label="Access Denials" 
          value="4" 
          trend={{ direction: 'down', value: '12%' }}
          variant="tonal-warning"
          icon={ShieldAlert}
        />
        <MetricCard 
          label="Active Policies" 
          value="24" 
          variant="tonal-info"
          icon={FileCheck}
        />
        <MetricCard 
          label="Last Audit" 
          value="2m ago" 
          variant="tonal-success"
          icon={History}
        />
      </div>

      {/* Registry Surface */}
      <DataTable 
        title="Audit Registry"
        description="Encrypted execution logs of all administrative and operational activities within the system."
        data={data}
        columns={columns}
      />
    </div>
  );
}
