"use client";

import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Activity, 
  User, 
  Terminal, 
  Globe, 
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";

// Mock Audit Log Data
const MOCK_AUDIT_LOGS = [
  { id: 'LOG-001', user: 'Chinedu Okoro', action: 'ROLE_MODIFICATION', target: 'HR Admin', context: 'IAM Console', status: 'SUCCESS', ip: '192.168.1.102', timestamp: '2 mins ago', severity: 'HIGH' },
  { id: 'LOG-002', user: 'Blessing Udoh', action: 'PROVISIONING_INVITE', target: 'a.james@suler.com', context: 'Provisioning Hub', status: 'SUCCESS', ip: '10.0.0.42', timestamp: '15 mins ago', severity: 'MEDIUM' },
  { id: 'LOG-003', user: 'David Okafor', action: 'HUB_CREATION', target: 'Abuja Regional Office', context: 'Org Workspace', status: 'SUCCESS', ip: '192.168.1.5', timestamp: '1h ago', severity: 'HIGH' },
  { id: 'LOG-004', user: 'System Sentinel', action: 'SECURITY_SCAN', target: 'Global Identity', context: 'Automated', status: 'COMPLETED', ip: 'INTERNAL', timestamp: '2h ago', severity: 'LOW' },
  { id: 'LOG-005', user: 'Sarah Williams', action: 'SESSION_REVOCATION', target: 'SES-094 (Unknown)', context: 'IAM Console', status: 'SUCCESS', ip: '10.0.5.12', timestamp: '4h ago', severity: 'CRITICAL' },
];

export default function AuditLogWorkspace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredLogs = MOCK_AUDIT_LOGS.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Identity & Action",
      accessor: "user",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
             {val[0]}
          </div>
          <div>
            <div className="text-[13px] font-black text-slate-900 tracking-tight leading-none mb-1">{val}</div>
            <div className="flex items-center gap-2">
               <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                 row.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : 
                 row.severity === 'HIGH' ? 'bg-amber-50 text-amber-600' : 
                 'bg-slate-100 text-slate-500'
               }`}>
                  {row.action.replace('_', ' ')}
               </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Target / Entity",
      accessor: "target",
      render: (val: string) => (
        <div className="text-[12px] font-bold text-slate-600 truncate max-w-[200px]">{val}</div>
      )
    },
    {
      header: "Operational Context",
      accessor: "context",
      render: (val: string) => (
        <div className="flex items-center gap-2">
           <Activity className="w-3 h-3 text-slate-300" />
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{val}</span>
        </div>
      )
    },
    {
      header: "Security Context",
      accessor: "ip",
      render: (val: string) => (
        <div className="flex flex-col">
           <span className="text-[11px] font-bold text-slate-500">{val}</span>
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Client IP</span>
        </div>
      )
    },
    {
      header: "Dispatch",
      accessor: "timestamp",
      render: (val: string) => (
        <div className="flex items-center gap-2">
           <Clock className="w-3.5 h-3.5 text-slate-300" />
           <span className="text-[12px] font-medium text-slate-500">{val}</span>
        </div>
      )
    }
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10 pb-20">
      
      {/* High-Authority Audit Header */}
      <div className="bg-slate-950 rounded-[32px] p-10 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-indigo-500/20">
                <Database className="w-3 h-3" />
                Immutable Records
              </div>
            </div>
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-3">
                 System Audit Trails
               </h1>
               <p className="text-[14px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
                 Comprehensive event streaming and historical integrity verification. Monitor every administrative action, provisioning lifecycle, and security state change.
               </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
               <input 
                 type="text" 
                 placeholder="Filter logs..." 
                 className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-11 pr-5 text-[12px] font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all w-64"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button className="bg-white hover:bg-slate-100 text-slate-950 flex items-center gap-2 px-6 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg">
              <Download className="w-[18px] h-[18px] stroke-[1.5px]" />
              Export Registry
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center w-[48px] h-[48px] rounded-xl transition-all border border-slate-700">
              <Filter className="w-[18px] h-[18px] stroke-[1.5px]" />
            </button>
          </div>
        </div>

        {/* Audit Analytics Indicators */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-800">
           <AuditStat label="Events Logged (24h)" value="12,482" />
           <AuditStat label="Security Anomalies" value="0" status="SECURE" />
           <AuditStat label="Data Integrity" value="100%" status="VERIFIED" />
           <AuditStat label="Storage Sync" value="REAL-TIME" />
        </div>
      </div>

      {/* Main Registry */}
      <DataTable 
        title="Event Streaming"
        description="Real-time monitoring of organizational governance actions and system-level events."
        data={filteredLogs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No historical events match the current filter criteria."
      />
      
      {/* Technical Log Detail Overlay Simulation */}
      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200/60 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
               <Terminal className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">System Health</p>
               <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none">Global Log Forwarding Active</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Synced with Cloudflare Audit</span>
            </div>
            <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">Configure Webhooks</button>
         </div>
      </div>
    </div>
  );
}

const AuditStat = ({ label, value, status }: any) => (
  <div className="flex flex-col gap-1">
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
     <div className="flex items-baseline gap-3">
        <span className="text-xl font-black text-white tracking-tight">{value}</span>
        {status && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{status}</span>}
     </div>
  </div>
);
