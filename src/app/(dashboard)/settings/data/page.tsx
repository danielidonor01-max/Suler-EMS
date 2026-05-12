"use client";

import React, { useState } from 'react';
import {
  Database, HardDrive, Download, Upload, Trash2, RefreshCw,
  CheckCircle2, Clock, Archive, AlertTriangle, Plus, Shield,
  FileJson, FileText, Calendar
} from 'lucide-react';
import { RouteGuard } from '@/components/common/RouteGuard';
import { useWorkforce } from '@/context/WorkforceContext';
import { usePayroll } from '@/context/PayrollContext';
import { useFinance } from '@/context/FinanceContext';
import { useTeams } from '@/context/TeamContext';
import { useSettings } from '@/context/SettingsContext';
import { useActivity } from '@/context/ActivityContext';
import { useAccess } from '@/context/AccessContext';
import { useOrganization } from '@/context/OrganizationContext';

const MOCK_BACKUPS = [
  { id: 'BKP-001', name: 'Auto Backup — 11 May 2026', size: '284 MB', type: 'AUTO', status: 'COMPLETE', created: '2026-05-11T02:00:00Z' },
  { id: 'BKP-002', name: 'Manual Snapshot — Pre-Migration', size: '271 MB', type: 'MANUAL', status: 'COMPLETE', created: '2026-05-10T15:30:00Z' },
  { id: 'BKP-003', name: 'Auto Backup — 10 May 2026', size: '268 MB', type: 'AUTO', status: 'COMPLETE', created: '2026-05-10T02:00:00Z' },
  { id: 'BKP-004', name: 'Auto Backup — 09 May 2026', size: '264 MB', type: 'AUTO', status: 'COMPLETE', created: '2026-05-09T02:00:00Z' },
];

const DATA_MODULES = [
  { name: 'Employees & Personnel', records: '1,284', size: '42 MB', lastExport: '2026-05-10' },
  { name: 'Payroll Records', records: '8,420', size: '88 MB', lastExport: '2026-05-01' },
  { name: 'Finance & Budgets', records: '3,910', size: '56 MB', lastExport: '2026-04-30' },
  { name: 'Audit Registry', records: '24,800', size: '72 MB', lastExport: '2026-05-11' },
  { name: 'Attendance Records', records: '18,600', size: '34 MB', lastExport: '2026-05-08' },
];

export default function DataManagementPage() {
  const { employees } = useWorkforce();
  const { payrollRuns } = usePayroll();
  const { budgets, expenditures } = useFinance();
  const { teams } = useTeams();
  const { settings } = useSettings();
  const { pushActivity } = useActivity();
  const { userRole } = useAccess();
  const { departments } = useOrganization();

  const [backups, setBackups] = useState(MOCK_BACKUPS);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  const createBackup = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      const newBackup = {
        id: `BKP-${Date.now()}`,
        name: `Manual Snapshot — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        size: '285 MB',
        type: 'MANUAL',
        status: 'COMPLETE',
        created: new Date().toISOString()
      };
      setBackups(prev => [newBackup, ...prev]);
      setIsCreatingBackup(false);
    }, 2000);
  };

  const deleteBackup = (id: string) => setBackups(prev => prev.filter(b => b.id !== id));

  const exportAllJSON = () => {
    const snapshot = {
      workforce: employees,
      payroll: payrollRuns,
      finance: { budgets, expenditures },
      teams: teams,
      organization: departments,
      settings: settings,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suler-enterprise-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'System Data Exported (JSON)',
      message: 'Full enterprise snapshot downloaded.',
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const exportCSV = (data: any[], filename: string, logType: string) => {
    if (!data || data.length === 0) return alert('No data available to export.');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => {
      if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
      if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
      return v;
    }).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    pushActivity({
      type: 'GOVERNANCE',
      label: `System Data Exported (CSV)`,
      message: `${logType} Downloaded.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const exportModuleCSV = (moduleName: string) => {
    const dateStr = new Date().toISOString().split('T')[0];
    switch(moduleName) {
      case 'Employees & Personnel':
        exportCSV(employees, `suler-workforce-${dateStr}.csv`, 'Workforce Data');
        break;
      case 'Payroll Records':
        exportCSV(payrollRuns.flatMap(r => r.entries), `suler-payroll-${dateStr}.csv`, 'Payroll Records');
        break;
      case 'Finance & Budgets':
        exportCSV(expenditures, `suler-finance-${dateStr}.csv`, 'Financial Expenditures');
        break;
      case 'Audit Registry':
        // Just mock this since audit registry isn't globally exposed
        exportCSV([{ audit: 'No data' }], `suler-audit-${dateStr}.csv`, 'Audit Registry');
        break;
      default:
        alert('Export for this module is not yet configured.');
    }
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="section-breathing max-w-[1200px] mx-auto animate-in space-y-8">
        {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 w-fit">
            <Database className="w-3 h-3" />Data Governance
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Data Management</h1>
          <p className="text-[13px] font-medium text-slate-400 max-w-[500px] leading-relaxed">
            Manage backup schedules, restore points, data exports, and retention policies.
          </p>
        </div>
        <button
          onClick={createBackup}
          disabled={isCreatingBackup}
          className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-70"
        >
          {isCreatingBackup ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />Creating Backup...</>
          ) : (
            <><HardDrive className="w-4 h-4" />Create Backup</>
          )}
        </button>
      </div>

      {/* Storage KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Storage Used', value: '292 MB', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Backup Count', value: `${backups.length}`, icon: Archive, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Retention Policy', value: `${retentionDays}d`, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Last Backup', value: '2h ago', icon: Clock, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-100' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-[20px] p-5 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${card.color} shadow-sm border ${card.border}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className={`text-xl font-black tracking-tighter ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Backup List */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Archive className="w-5 h-5 text-slate-400" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Backup Registry</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Restore Points</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {backups.map((backup, i) => (
              <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${backup.type === 'MANUAL' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                    {backup.type === 'MANUAL' ? 'M' : 'A'}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{backup.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{backup.size} · {new Date(backup.created).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {i === 0 && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold rounded-full uppercase">Latest</span>}
                  <button className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteBackup(backup.id)} className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-400 hover:border-rose-200 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Policy */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Shield className="w-5 h-5 text-slate-400" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Retention Policy</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Backup Rules</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Keep backups for', value: retentionDays, unit: 'days', setter: setRetentionDays, min: 30, max: 365 },
              ].map(rule => (
                <div key={rule.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">{rule.label}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => rule.setter(Math.max(rule.min, rule.value - 30))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center hover:bg-slate-100">−</button>
                    <span className="text-xl font-black text-slate-900 w-16 text-center">{rule.value} {rule.unit}</span>
                    <button onClick={() => rule.setter(Math.min(rule.max, rule.value + 30))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center hover:bg-slate-100">+</button>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700">Backups older than {retentionDays} days will be automatically purged.</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Backup Schedule</p>
              {['Daily at 2:00 AM', 'Weekly on Sunday', 'Monthly on 1st'].map(s => (
                <div key={s} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] font-bold text-slate-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Download className="w-5 h-5 text-slate-400" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Data Export Center</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Module Snapshots</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportAllJSON} className="flex items-center gap-2 px-4 h-9 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-slate-100 transition-all">
              <FileJson className="w-3.5 h-3.5" />Export All as JSON
            </button>
            <button onClick={() => exportModuleCSV('Employees & Personnel')} className="flex items-center gap-2 px-4 h-9 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-wide hover:bg-slate-100 transition-all">
              <FileText className="w-3.5 h-3.5" />Export Workforce CSV
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {DATA_MODULES.map(module => (
            <div key={module.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{module.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{module.records} records · {module.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-300">Last export: {module.lastExport}</span>
                <button onClick={() => exportModuleCSV(module.name)} className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </RouteGuard>
  );
}
