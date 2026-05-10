"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Target, 
  Settings,
  Scale,
  Percent,
  FileCheck,
  Zap,
  Globe,
  PieChart,
  Building2,
  Lock,
  History,
  Layers
} from 'lucide-react';
import { usePayroll } from '@/context/PayrollContext';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function PayrollPoliciesPage() {
  const { policy, updatePolicy } = usePayroll();
  const { userRole } = useAccess();

  const [pension, setPension] = useState(policy.pensionEmployeeRate.toString());
  const [nhf, setNhf] = useState(policy.nhfRate.toString());
  const [relief, setRelief] = useState(policy.taxReliefBase.toString());

  // Access: Only Super Admin can change policies
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleSave = () => {
    updatePolicy({
      ...policy,
      pensionEmployeeRate: parseFloat(pension),
      nhfRate: parseFloat(nhf),
      taxReliefBase: parseFloat(relief)
    });
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-12">
      
      {/* Policy Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
             <div className="px-2.5 py-1 bg-slate-950 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Statutory Controls
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
            Payroll Policy Configuration
          </h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
            Manage Nigerian statutory deductions, tax relief parameters, and institutional compensation standards.
          </p>
        </div>

        {isSuperAdmin && (
          <button 
            onClick={handleSave}
            className="h-11 px-8 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
             Commit Policy Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Statutory Rates */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-premium">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                     <Scale className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 tracking-tight">Statutory Deduction Rules</h3>
                     <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mt-1">Nigerian Compliance Baseline</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Pension (Employee %)</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             step="0.01"
                             disabled={!isSuperAdmin}
                             value={pension} 
                             onChange={e => setPension(e.target.value)}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                              <Percent className="w-5 h-5" />
                           </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">Default: 8% (PRA 2014)</p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">NHF (Basic Salary %)</label>
                        <div className="relative">
                           <input 
                             type="number" 
                             step="0.001"
                             disabled={!isSuperAdmin}
                             value={nhf} 
                             onChange={e => setNhf(e.target.value)}
                             className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                              <Percent className="w-5 h-5" />
                           </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">Default: 2.5%</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tax Relief (Fixed Base ₦)</label>
                        <input 
                          type="number" 
                          disabled={!isSuperAdmin}
                          value={relief} 
                          onChange={e => setRelief(e.target.value)}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">Annual relief component applied per cycle.</p>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                           <FileCheck className="w-4 h-4 text-emerald-500" />
                           <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Auto-Calculation active</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                           Suler EMS automatically applies these parameters to the Monthly Payroll Register upon cycle initialization.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-10 border border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-4">
                     <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <Zap className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-bold text-white tracking-tight">Audit Trail Integration</h3>
                     <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[400px]">
                        Every policy modification is timestamped and recorded in the Audit Registry, ensuring full accountability for compensation changes.
                     </p>
                  </div>
                  <button className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-white/10">
                     View Policy Logs
                  </button>
               </div>
            </div>
         </div>

         {/* Grade Levels / Bands */}
         <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
               <Layers className="w-4 h-4 text-slate-400" />
               <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Salary Bands</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-premium space-y-8">
               {[
                 { level: 'Level 10 (Director)', range: '₦1.2M - ₦1.8M', employees: 4 },
                 { level: 'Level 8 (Manager)', range: '₦750k - ₦950k', employees: 12 },
                 { level: 'Level 5 (Senior)', range: '₦450k - ₦600k', employees: 45 },
                 { level: 'Level 3 (Associate)', range: '₦250k - ₦350k', employees: 82 }
               ].map((band, idx) => (
                 <div key={idx} className="flex justify-between items-center group">
                    <div className="space-y-1">
                       <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{band.level}</h4>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{band.range}</p>
                    </div>
                    <div className="text-right space-y-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{band.employees} Staff</span>
                    </div>
                 </div>
               ))}
               
               <button className="w-full h-11 border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">
                  Configure Salary Grades
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
