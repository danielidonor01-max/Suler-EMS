'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  History, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  Search,
  Filter,
  ArrowUpRight,
  Database,
  Eye,
  FileText,
  ChevronDown
} from 'lucide-react';

type GovernanceTab = 'SECURITY' | 'OPERATIONS' | 'HR_AUDIT';

const GovernanceConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GovernanceTab>('SECURITY');

  const tabs = [
    { id: 'SECURITY', label: 'Security Audit', icon: ShieldAlert, color: 'bg-rose-500', textColor: 'text-rose-600' },
    { id: 'OPERATIONS', label: 'Operational Change Log', icon: History, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { id: 'HR_AUDIT', label: 'Workforce Compliance', icon: Users, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Governance</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Realtime Audit & Compliance Control</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GovernanceTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.textColor : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Filter audit records..." 
                className="bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all w-72"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all uppercase tracking-widest shadow-sm">
              <Filter className="w-3 h-3" />
              Advanced
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Storage: Active (7Y)</span>
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="min-h-[500px] p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'SECURITY' && <SecurityAuditView />}
              {activeTab === 'OPERATIONS' && <OperationalChangeView />}
              {activeTab === 'HR_AUDIT' && <WorkforceComplianceView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SecurityAuditView = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-6">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-rose-500" />
        High Risk Security Events
      </h4>
      <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Last 24 Hours</span>
    </div>
    
    {[
      { event: 'Bulk Session Revocation', actor: 'System (Geo-Anomaly)', target: 'User #9283', severity: 'CRITICAL', time: '12:42:01' },
      { event: 'Unauthorized IP Access', actor: 'Unknown', target: 'Auth API', severity: 'HIGH', time: '11:15:30' },
      { event: 'Role Escalation Attempt', actor: 'Staff #1029', target: 'RBAC Policy', severity: 'MEDIUM', time: '09:30:12' },
    ].map((item, i) => (
      <div key={i} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            item.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.event}</h5>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Actor: {item.actor}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Target: {item.target}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className={`block text-[10px] font-extrabold uppercase tracking-widest ${
              item.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'
            }`}>{item.severity}</span>
            <span className="text-[10px] text-slate-400 font-bold">{item.time}</span>
          </div>
          <button className="p-3 bg-slate-50 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-xl transition-all">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const OperationalChangeView = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-6">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-indigo-500" />
        Infrastructure & Policy Changes
      </h4>
    </div>
    
    {[
      { change: 'SLA Policy Modified', actor: 'Admin Daniel', module: 'Workflows', impact: 'GLOBAL', time: '14:20' },
      { change: 'Database Schema Migration', actor: 'System (CI/CD)', module: 'Persistence', impact: 'SYSTEM', time: 'Yesterday' },
      { change: 'Device Trust Overridden', actor: 'Ops Lead', module: 'Hardware', impact: 'BRANCH_A', time: 'Yesterday' },
    ].map((item, i) => (
      <div key={i} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900">{item.change}</h5>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">By: {item.actor}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Module: {item.module}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-full tracking-tighter">
            Impact: {item.impact}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.time}</span>
        </div>
      </div>
    ))}
  </div>
);

const WorkforceComplianceView = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[32px]">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-emerald-500" />
        SLA Breach Analysis
      </h4>
      <div className="space-y-4">
        {[
          { type: 'Leave Approval', target: '4h', actual: '26h', status: 'BREACHED' },
          { type: 'Attendance Sync', target: '5s', actual: '2s', status: 'OPTIMAL' },
          { type: 'Incident Response', target: '1h', actual: '15m', status: 'OPTIMAL' },
        ].map((sla, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:translate-x-1">
            <span className="text-xs font-bold text-slate-700">{sla.type}</span>
            <div className="flex items-center gap-5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">T: {sla.target} / A: {sla.actual}</span>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                sla.status === 'BREACHED' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>{sla.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[32px]">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-indigo-500" />
        Data Retention Status
      </h4>
      <div className="space-y-8">
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audit Archive (7Y Window)</span>
            <span className="text-[10px] text-slate-900 font-extrabold uppercase tracking-tighter">12.4GB / 50GB</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-indigo-500 w-[24%] shadow-lg shadow-indigo-200" />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Raw Attendance (1Y Window)</span>
            <span className="text-[10px] text-slate-900 font-extrabold uppercase tracking-tighter">8.2GB / 100GB</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-emerald-500 w-[8%] shadow-lg shadow-emerald-200" />
          </div>
        </div>
        <div className="p-4 bg-white/60 border border-slate-100 rounded-xl">
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            <span className="font-bold text-indigo-600 uppercase tracking-tighter block mb-1">Status: Operational</span>
            Retention engine active. Auto-purging of records older than 7 years is scheduled for 02:00 AM WAT daily.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default GovernanceConsole;
