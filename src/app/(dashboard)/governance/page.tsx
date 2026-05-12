"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Eye, FileCheck, AlertTriangle, ShieldAlert, 
  Activity, Download, History, Filter, User, Banknote, LogIn,
  LogOut, UserPlus, TrendingUp, Settings, Database, Key, RefreshCcw
} from 'lucide-react';
import { DataTable } from "@/components/tables/DataTable";
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RouteGuard } from '@/components/common/RouteGuard';

// ─── Comprehensive Audit Log Data ────────────────────────────────────────────
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const MOCK_AUDIT_LOGS = [
  // Auth Events
  { id: 'log-001', actor: 'Chinedu Okoro',   hub: 'Lagos HQ',       role: 'SUPER_ADMIN',   action: 'LOGIN',              entity: 'Auth System',     severity: 'LOW',      status: 'SUCCESS', timestamp: '2026-05-12T05:01:00Z' },
  { id: 'log-002', actor: 'Unknown',          hub: '—',              role: '—',             action: 'LOGIN_FAILED',       entity: 'Auth System',     severity: 'CRITICAL', status: 'DENIED',  timestamp: '2026-05-11T13:45:00Z' },
  { id: 'log-003', actor: 'Sarah Williams',   hub: 'Lagos HQ',       role: 'HR_MANAGER',    action: 'LOGOUT',             entity: 'Auth System',     severity: 'LOW',      status: 'SUCCESS', timestamp: '2026-05-11T17:30:00Z' },
  // Workforce Events
  { id: 'log-004', actor: 'Chinedu Okoro',   hub: 'Port Harcourt',  role: 'SUPER_ADMIN',   action: 'EMPLOYEE_ONBOARDED', entity: 'Blessing Adeyemi',severity: 'MEDIUM',   status: 'SUCCESS', timestamp: '2026-05-08T11:00:00Z' },
  { id: 'log-005', actor: 'Sarah Williams',   hub: 'Lagos HQ',       role: 'HR_MANAGER',    action: 'PROMOTION',          entity: 'Alex Okereke',    severity: 'MEDIUM',   status: 'SUCCESS', timestamp: '2026-05-05T14:00:00Z' },
  // Payroll Events
  { id: 'log-006', actor: 'Chinedu Okoro',   hub: 'Lagos HQ',       role: 'SUPER_ADMIN',   action: 'PAYROLL_APPROVED',   entity: 'APR 2026 Run',    severity: 'HIGH',     status: 'SUCCESS', timestamp: '2026-05-01T09:00:00Z' },
  { id: 'log-007', actor: 'Emeka Okafor',    hub: 'Abuja Regional', role: 'FINANCE_ADMIN', action: 'SALARY_ADJUSTMENT',  entity: 'David Okafor',    severity: 'HIGH',     status: 'SUCCESS', timestamp: '2026-04-28T11:30:00Z' },
  // Finance Events
  { id: 'log-008', actor: 'Emeka Okafor',    hub: 'Abuja Regional', role: 'FINANCE_ADMIN', action: 'EXPENSE_APPROVED',   entity: 'Q2 Marketing',    severity: 'MEDIUM',   status: 'SUCCESS', timestamp: '2026-05-07T12:00:00Z' },
  // Leave Events
  { id: 'log-009', actor: 'Sarah Williams',   hub: 'Lagos HQ',       role: 'HR_MANAGER',    action: 'LEAVE_APPROVED',     entity: 'David Okafor',    severity: 'LOW',      status: 'SUCCESS', timestamp: '2026-05-02T14:00:00Z' },
  { id: 'log-010', actor: 'Chinedu Okoro',   hub: 'All Regions',    role: 'SUPER_ADMIN',   action: 'LEAVE_REJECTED',     entity: 'Kemi Adesanya',   severity: 'MEDIUM',   status: 'DENIED',  timestamp: '2026-05-03T10:15:00Z' },
  // Role & Security Events
  { id: 'log-011', actor: 'Chinedu Okoro',   hub: 'Lagos HQ',       role: 'SUPER_ADMIN',   action: 'ROLE_UPDATE',        entity: 'Alex Okereke',    severity: 'HIGH',     status: 'SUCCESS', timestamp: '2026-05-01T10:00:00Z' },
  { id: 'log-012', actor: 'Chinedu Okoro',   hub: 'All Regions',    role: 'SUPER_ADMIN',   action: 'SECURITY_POLICY',    entity: 'Password Policy', severity: 'HIGH',     status: 'SUCCESS', timestamp: '2026-04-30T16:00:00Z' },
  { id: 'log-013', actor: 'System',          hub: '—',              role: 'SYSTEM',        action: 'SESSION_REVOKED',    entity: 'S-003 Token',     severity: 'CRITICAL', status: 'SUCCESS', timestamp: '2026-05-10T09:00:00Z' },
  // Integration Events
  { id: 'log-014', actor: 'System',          hub: '—',              role: 'SYSTEM',        action: 'INTEGRATION_FAILED', entity: 'SMTP Relay',       severity: 'CRITICAL', status: 'FAILED',  timestamp: '2026-05-10T22:15:00Z' },
  // Data Events
  { id: 'log-015', actor: 'Chinedu Okoro',   hub: 'All Regions',    role: 'SUPER_ADMIN',   action: 'DATA_EXPORT',        entity: 'Staff Records',   severity: 'MEDIUM',   status: 'SUCCESS', timestamp: '2026-05-01T10:15:00Z' },
  { id: 'log-016', actor: 'System',          hub: '—',              role: 'SYSTEM',        action: 'BACKUP_CREATED',     entity: 'BCK-20260511',    severity: 'LOW',      status: 'SUCCESS', timestamp: '2026-05-11T03:00:00Z' },
  // Compliance
  { id: 'log-017', actor: 'Chinedu Okoro',   hub: 'All Regions',    role: 'SUPER_ADMIN',   action: 'COMPLIANCE_UPDATE',  entity: 'PAYE Rate 2026',  severity: 'HIGH',     status: 'SUCCESS', timestamp: '2026-01-01T08:00:00Z' },
];

const ACTION_ICON: Record<string, React.ElementType> = {
  LOGIN: LogIn, LOGOUT: LogOut, LOGIN_FAILED: AlertTriangle,
  EMPLOYEE_ONBOARDED: UserPlus, PROMOTION: TrendingUp,
  PAYROLL_APPROVED: Banknote, SALARY_ADJUSTMENT: Banknote,
  EXPENSE_APPROVED: Banknote, LEAVE_APPROVED: FileCheck,
  LEAVE_REJECTED: FileCheck, ROLE_UPDATE: Key,
  SECURITY_POLICY: ShieldCheck, SESSION_REVOKED: ShieldAlert,
  INTEGRATION_FAILED: Activity, DATA_EXPORT: Database,
  BACKUP_CREATED: Database, COMPLIANCE_UPDATE: Settings,
};

const SEVERITY_CONFIG: Record<Severity, { bg: string; text: string }> = {
  LOW:      { bg: 'bg-slate-50',   text: 'text-slate-500' },
  MEDIUM:   { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  HIGH:     { bg: 'bg-amber-50',   text: 'text-amber-600' },
  CRITICAL: { bg: 'bg-rose-50',    text: 'text-rose-600' },
};

const CATEGORIES = ['All', 'Auth', 'Workforce', 'Payroll', 'Finance', 'Leave', 'Security', 'Data', 'System'];
const CATEGORY_ACTIONS: Record<string, string[]> = {
  Auth:      ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'],
  Workforce: ['EMPLOYEE_ONBOARDED', 'PROMOTION'],
  Payroll:   ['PAYROLL_APPROVED', 'SALARY_ADJUSTMENT'],
  Finance:   ['EXPENSE_APPROVED'],
  Leave:     ['LEAVE_APPROVED', 'LEAVE_REJECTED'],
  Security:  ['ROLE_UPDATE', 'SECURITY_POLICY', 'SESSION_REVOKED'],
  Data:      ['DATA_EXPORT', 'BACKUP_CREATED', 'COMPLIANCE_UPDATE'],
  System:    ['INTEGRATION_FAILED', 'BACKUP_CREATED'],
};

export default function GovernancePage() {
  const [category, setCategory] = useState('All');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    const catMatch = category === 'All' || (CATEGORY_ACTIONS[category] || []).includes(log.action);
    const sevMatch = severityFilter === 'All' || log.severity === severityFilter;
    return catMatch && sevMatch;
  });

  const critical = MOCK_AUDIT_LOGS.filter(l => l.severity === 'CRITICAL').length;
  const denied   = MOCK_AUDIT_LOGS.filter(l => l.status === 'DENIED' || l.status === 'FAILED').length;

  const columns = [
    {
      header: "Actor",
      accessor: "actor",
      render: (val: string, row: any) => {
        const Icon = ACTION_ICON[row.action] || Activity;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 shrink-0">
              {val === 'System' ? <Icon className="w-4 h-4" /> : val.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <span className="text-[13px] font-bold text-slate-900 tracking-tight">{val}</span>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.role}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Operation",
      accessor: "action",
      render: (val: string) => {
        const cfg = SEVERITY_CONFIG['MEDIUM'];
        return (
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            {val.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      header: "Entity",
      accessor: "entity",
      render: (val: string) => <span className="text-[13px] font-bold text-slate-700">{val}</span>
    },
    {
      header: "Hub",
      accessor: "hub",
      render: (val: string) => <span className="text-[11px] font-bold text-slate-400">{val}</span>
    },
    {
      header: "Severity",
      accessor: "severity",
      render: (val: Severity) => {
        const cfg = SEVERITY_CONFIG[val];
        return (
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${cfg.bg} ${cfg.text}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessor: "status",
      render: (val: string) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
          val === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
          val === 'DENIED'  ? 'bg-rose-50 text-rose-600' :
          'bg-amber-50 text-amber-600'
        }`}>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{val}</span>
        </div>
      )
    },
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (val: string) => (
        <div>
          <div className="text-[11px] font-bold text-slate-700">
            {new Date(val).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            {new Date(val).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    }
  ];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* Executive Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Zero Trust Architecture
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Audit Registry
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[500px]">
              Immutable audit trails of all administrative operations, access events, payroll mutations, and security incidents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 hover:border-slate-300 flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all">
              <Download className="w-4 h-4" />
              Export Logs
            </button>
            <button className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Layer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Audit Integrity" value="100%" variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Critical Events" value={`${critical}`} trend={{ direction: 'up', value: '2' }} variant="tonal-danger" icon={ShieldAlert} />
        <MetricCard label="Access Denials" value={`${denied}`} variant="tonal-warning" icon={AlertTriangle} />
        <MetricCard label="Total Events" value={`${MOCK_AUDIT_LOGS.length}`} variant="tonal-info" icon={History} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                category === cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => {
            const cfg = sev === 'All' ? { bg: 'bg-slate-50', text: 'text-slate-500' } : SEVERITY_CONFIG[sev as Severity];
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  severityFilter === sev
                    ? 'ring-2 ring-slate-900 ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                } ${cfg.bg} ${cfg.text} border border-transparent`}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Registry Surface */}
      <DataTable
        title={`Audit Registry (${filtered.length} events)`}
        description="Encrypted execution logs of all administrative and operational activities within the system."
        data={filtered}
        columns={columns}
      />
      </div>
    </RouteGuard>
  );
}
