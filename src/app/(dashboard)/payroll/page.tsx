"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Banknote, 
  Target, 
  History, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Building2,
  PieChart,
  UserCheck,
  FileText,
  Activity,
  Zap,
  ChevronRight,
  Settings,
  Calculator,
  GanttChart,
  Users
} from 'lucide-react';
import { usePayroll, PayrollRun } from '@/context/PayrollContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function PayrollOverviewPage() {
  const { payrollRuns, adjustments } = usePayroll();
  const { currentHub } = useOrganization();
  const { userRole } = useAccess();

  // Access Control
  const isFinanceAdmin = userRole === 'FINANCE_ADMIN';

  // Hub Filtering
  const filteredRuns = payrollRuns.filter(r => currentHub === 'All Regions' || r.hub === currentHub);
  
  // Aggregates
  const processedRuns = filteredRuns.filter(r => r.status === 'PROCESSED');
  const latestRun = processedRuns[0] || filteredRuns[0];
  
  const totalGross = latestRun?.totalGross || 0;
  const totalNet = latestRun?.totalNet || 0;
  const totalTax = latestRun?.entries.reduce((sum, e) => sum + e.paye, 0) || 0;
  const totalPension = latestRun?.entries.reduce((sum, e) => sum + e.pension, 0) || 0;

  const quickLinks = [
    { name: 'Payroll Register', icon: FileText, href: '/payroll/register', desc: 'Operational salary register and cycle management.' },
    { name: 'Bulk Adjustments', icon: Users, href: '/payroll/register', desc: 'Apply bonuses & deductions across hubs.' },
    { name: 'Compliance & Tax', icon: ShieldCheck, href: '/settings/compliance', desc: 'Manage PAYE, Pension, and NHF rules.' },
    { name: 'Audit Registry', icon: History, href: '/governance', desc: 'Immutable logs of all payroll mutations.' },
  ];

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      
      {/* Executive Command Surface */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Banknote className="w-3 h-3" />
                Compensation Intelligence
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
            Payroll Governance
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[500px]">
            Enterprise command surface for Nigerian salary administration, statutory compliance, and automated disbursement oversight.
          </p>
        </div>

        {!isFinanceAdmin && (
          <div className="flex items-center gap-3">
             <Link 
               href="/payroll/register"
               className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-100"
             >
                <Zap className="w-4 h-4" />
                Initialize Next Cycle
             </Link>
          </div>
        )}
      </div>

      {/* Payroll KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Monthly Gross Liability" value={formatCurrency(totalGross)} icon={PieChart} variant="tonal-info" />
        <MetricCard label="Total Net Pay" value={formatCurrency(totalNet)} trend={{ direction: 'up', value: '2.4%' }} variant="tonal-info" icon={TrendingUp} />
        <MetricCard label="PAYE Remittance" value={formatCurrency(totalTax)} variant="tonal-success" icon={ShieldCheck} />
        <MetricCard label="Pension Accrual" value={formatCurrency(totalPension)} variant="tonal-success" icon={Activity} />
      </div>

      {/* Navigation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {quickLinks.map((link, idx) => (
           <Link key={idx} href={link.href} className="bg-white p-6 rounded-[28px] border border-slate-200 hover:border-indigo-200 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all mb-6">
                 <link.icon className="w-6 h-6" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{link.name}</h3>
              <p className="text-[12px] font-medium text-slate-400 leading-relaxed mb-6">{link.desc}</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                 Enter Module
                 <ChevronRight className="w-3.5 h-3.5" />
              </div>
           </Link>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Regional Distribution */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 px-2">
               <Building2 className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Regional Cost Distribution</h2>
            </div>
            <div className="bg-slate-900 rounded-[32px] p-10 border border-slate-800 shadow-premium relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                  <div className="space-y-4">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Average</span>
                     <div className="text-4xl font-black text-white tracking-tighter">₦42.8M</div>
                     <p className="text-[12px] text-slate-400 leading-relaxed">Consolidated payroll burden across all operational regional hubs.</p>
                  </div>
                  <div className="md:col-span-2 space-y-6">
                     {[
                       { label: 'Lagos HQ', value: '₦22.5M', pct: 85 },
                       { label: 'Abuja Regional', value: '₦12.2M', pct: 45 },
                       { label: 'Port Harcourt', value: '₦8.1M', pct: 30 }
                     ].map((hub, idx) => (
                       <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                             <span>{hub.label}</span>
                             <span className="text-white">{hub.value}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${hub.pct}%` }} />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Latest Statutory Summary */}
         <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
               <ShieldCheck className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Compliance Health</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-premium space-y-8">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Compliance Score</h3>
                     <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">Status: Verified</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <GanttChart className="w-5 h-5 text-indigo-600" />
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Pension Remittance</span>
                     </div>
                     <span className="text-[12px] font-black text-slate-900">PENDING</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">PAYE Tax Audit</span>
                     </div>
                     <span className="text-[12px] font-black text-emerald-600 uppercase">Passed</span>
                  </div>
               </div>

               <Link 
                 href="/settings/compliance"
                 className="w-full h-11 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
               >
                  Audit Global Rules
                  <ArrowRight className="w-3.5 h-3.5" />
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
}
