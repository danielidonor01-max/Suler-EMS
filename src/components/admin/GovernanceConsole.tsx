'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Lock, 
  Eye, 
  Database,
  Search,
  Filter,
  Download,
  Terminal,
  History
} from 'lucide-react';
import { MetricCard } from '../dashboard/MetricCard';
import { DataTable } from '../tables/DataTable';

const GovernanceConsole = () => {
  const auditLogs = [
    { id: 1, action: 'PRIVILEGED_ACCESS_GRANTED', user: 'Chinedu Okoro', entity: 'Financial Records', time: '2 mins ago', risk: 'LOW' },
    { id: 2, action: 'SYSTEM_CONFIG_CHANGE', user: 'Admin System', entity: 'Rate Limiter', time: '14 mins ago', risk: 'MEDIUM' },
    { id: 3, action: 'BULK_DATA_EXPORT', user: 'Kelechi Nwosu', entity: 'Staff Registry', time: '1 hour ago', risk: 'HIGH' },
    { id: 4, action: 'SECURITY_POLICY_UPDATE', user: 'Security Bot', entity: 'MFA Requirements', time: '3 hours ago', risk: 'LOW' },
  ];

  const columns = [
    {
      header: 'Audit Event',
      accessor: 'action',
      render: (val: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-slate-400" />
          </div>
          <span className="font-bold text-slate-900">{val}</span>
        </div>
      )
    },
    { header: 'Principal', accessor: 'user' },
    { header: 'Target Entity', accessor: 'entity' },
    { header: 'Timestamp', accessor: 'time' },
    {
      header: 'Risk Score',
      accessor: 'risk',
      render: (val: string) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
          val === 'HIGH' ? 'bg-rose-50 text-rose-600' : 
          val === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 
          'bg-emerald-50 text-emerald-600'
        }`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-breathing animate-in">
      {/* Executive Command Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Operational Governance</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Governance & Security Control</h2>
          <p className="text-sm font-medium text-slate-400 mt-1">Real-time oversight of system integrity, audit trails, and administrative permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-premium bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 shadow-sm">
            <History className="w-4 h-4" />
            Export Audit Logs
          </button>
          <button className="btn-premium btn-primary">
            <Lock className="w-4 h-4" />
            Modify Security Policies
          </button>
        </div>
      </div>

      {/* Governance Health Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <MetricCard label="Integrity Score" value="99.9%" trend={{ direction: 'up', value: 'Optimal' }} icon={ShieldCheck} />
        <MetricCard label="Active Sessions" value="24" trend={{ direction: 'neutral', value: 'Live' }} icon={Activity} />
        <MetricCard label="Privileged Ops" value="12" trend={{ direction: 'down', value: '-4 vs avg' }} icon={Lock} variant="tonal-warning" />
        <MetricCard label="Data Compliance" value="100%" trend={{ direction: 'up', value: 'Certified' }} icon={Database} />
      </div>

      {/* Audit Intelligence Table */}
      <div className="space-y-6">
        <DataTable 
          title="Administrative Audit Trail"
          description="Immutable record of all high-privilege system operations."
          data={auditLogs}
          columns={columns}
        />
      </div>

      {/* Security Status Panel (Visual Silence) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-premium">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6">Security Baseline</h4>
          <div className="space-y-4">
            {[
              { label: 'Multi-Factor Auth', status: 'Enforced' },
              { label: 'IP Anomaly Detection', status: 'Active' },
              { label: 'Session Revocation', status: 'Enabled' },
              { label: 'Automated Backups', status: 'Healthy' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                <span className="px-3 py-1 bg-white border border-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Operational Insight</h4>
            <h3 className="text-2xl font-bold tracking-tight mb-4">Zero Trust Architecture</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8 opacity-90">
              The Suler EMS is currently operating under a Zero-Trust governance model. Every administrative request is verified for identity, device trust, and role-scoped authorization.
            </p>
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-lg">
              View Governance Policy
            </button>
          </div>
          {/* Abstract Glassmorphic Decoration */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute right-10 top-10 w-20 h-20 bg-indigo-400/20 rounded-full blur-xl" />
        </div>
      </div>
    </div>
  );
};

export default GovernanceConsole;
