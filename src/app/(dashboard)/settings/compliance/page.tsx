"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Target, 
  Settings as SettingsIcon,
  Scale,
  Percent,
  FileCheck,
  Zap,
  Globe,
  PieChart,
  Building2,
  Lock,
  History,
  Layers,
  ChevronRight,
  Calculator,
  GanttChart,
  Plus
} from 'lucide-react';
import { useSettings, CompliancePolicy } from '@/context/SettingsContext';
import { useAccess } from '@/context/AccessContext';

export default function CompliancePoliciesPage() {
  const { settings, updateSettings } = useSettings();
  const { userRole } = useAccess();

  const [policy, setPolicy] = useState<CompliancePolicy>(settings.compliance);

  // Access: Only Super Admin can change policies
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleSave = () => {
    updateSettings({ compliance: policy });
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      
      {/* Policy Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Enterprise Compliance
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
            Compliance & Statutory Policies
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
            Centrally manage Nigerian statutory deductions, tax brackets, and institutional compensation standards consumed by the Payroll engine.
          </p>
        </div>

        {isSuperAdmin && (
          <button 
            onClick={handleSave}
            className="h-11 px-8 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
             Commit Global Policies
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Statutory Rates */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-premium">
               <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                     <Scale className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nigerian Statutory Parameters</h3>
                     <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">LFN / PRA 2014 Baseline</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Pension (Employee %)</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             step="0.01"
                             disabled={!isSuperAdmin}
                             value={policy.pensionEmployeeRate * 100} 
                             onChange={e => setPolicy({...policy, pensionEmployeeRate: parseFloat(e.target.value) / 100})}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                              <Percent className="w-5 h-5" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">NHF (Basic Salary %)</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             step="0.01"
                             disabled={!isSuperAdmin}
                             value={policy.nhfRate * 100} 
                             onChange={e => setPolicy({...policy, nhfRate: parseFloat(e.target.value) / 100})}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                              <Percent className="w-5 h-5" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tax Relief Base (₦ Annual)</label>
                        <input 
                          type="number" 
                          disabled={!isSuperAdmin}
                          value={policy.taxReliefBase} 
                          onChange={e => setPolicy({...policy, taxReliefBase: parseFloat(e.target.value)})}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">ITF Contribution (%)</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             step="0.01"
                             disabled={!isSuperAdmin}
                             value={policy.itfContributionRate * 100} 
                             onChange={e => setPolicy({...policy, itfContributionRate: parseFloat(e.target.value) / 100})}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                              <Percent className="w-5 h-5" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Audit & Logs */}
            <div className="bg-slate-900 rounded-[32px] p-10 border border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-4">
                     <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <History className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-bold text-white tracking-tight">Governance Audit Trail</h3>
                     <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[400px]">
                        Any modification to statutory rates is an enterprise-wide event. All changes are logged with immutable timestamps for fiscal audits.
                     </p>
                  </div>
                  <button className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-white/10">
                     View Governance Logs
                  </button>
               </div>
            </div>
         </div>

         {/* Salary Bands & Grades */}
         <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
               <Layers className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Salary Grades</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-premium space-y-8">
               {settings.salaryBands.map((band, idx) => (
                 <div key={idx} className="flex justify-between items-center group">
                    <div className="space-y-1">
                       <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{band.level}</h4>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">₦{(band.minSalary/1000).toFixed(0)}k - ₦{(band.maxSalary/1000).toFixed(0)}k</p>
                    </div>
                    <div className="text-right">
                       <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ))}
               
               <button className="w-full h-11 border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Define New Grade
               </button>
            </div>

            <div className="bg-indigo-600 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-indigo-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                     <Calculator className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold tracking-tight">Calculation Engine</h4>
                  <p className="text-[12px] text-indigo-100 font-medium leading-relaxed mt-2">
                     Statutory rules defined here are automatically applied by the Payroll engine during monthly cycle generation.
                  </p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
