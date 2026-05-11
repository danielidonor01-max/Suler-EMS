"use client";

import React, { useMemo } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  ArrowRight,
  Zap,
  Info,
  ChevronRight,
  UserX,
  Target
} from 'lucide-react';
import { useWorkforce, Employee } from '@/context/WorkforceContext';

interface Absence {
  id: string;
  employeeId: string;
  name: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Maternity' | 'Study Leave';
  startDate: string;
  endDate: string;
  role: string;
  isCritical: boolean;
}

const MOCK_ABSENCES: Absence[] = [
  { 
    id: '1', 
    employeeId: 'EMP-003', 
    name: 'Sarah Williams', 
    type: 'Annual Leave', 
    startDate: '2026-05-12', 
    endDate: '2026-05-19',
    role: 'Payroll Lead',
    isCritical: true
  },
  { 
    id: '2', 
    employeeId: 'EMP-004', 
    name: 'John Doe', 
    type: 'Sick Leave', 
    startDate: '2026-05-14', 
    endDate: '2026-05-16',
    role: 'HR Analyst',
    isCritical: false
  }
];

export const CapacityIntelligencePanel: React.FC<{ teamId?: string }> = ({ teamId }) => {
  const { employees } = useWorkforce();
  
  // Intelligence Logic
  const stats = useMemo(() => {
    const totalCapacity = 100;
    const absentCount = MOCK_ABSENCES.length;
    const criticalAbsences = MOCK_ABSENCES.filter(a => a.isCritical);
    
    // Weighted capacity calculation (Simulated)
    const availableCapacity = 78; // %
    const skillCoverage = 92; // %
    const productivityImpact = -12; // %
    
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (availableCapacity < 60) riskLevel = 'CRITICAL';
    else if (availableCapacity < 75) riskLevel = 'HIGH';
    else if (availableCapacity < 90) riskLevel = 'MODERATE';

    return {
      availableCapacity,
      skillCoverage,
      productivityImpact,
      riskLevel,
      absentCount,
      criticalAbsences
    };
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'MODERATE': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-premium overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="p-8 pb-4 border-b border-slate-50">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                 <Clock className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1">Team Availability</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Absences & Capacity Impact</p>
              </div>
           </div>
           <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(stats.riskLevel)}`}>
              Risk: {stats.riskLevel}
           </div>
        </div>

        {/* Absence Registry */}
        <div className="space-y-3">
           {MOCK_ABSENCES.map((item) => (
             <div key={item.id} className="flex items-center justify-between p-4 border border-slate-50 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold ${item.isCritical ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                      {item.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-900">{item.name}</span>
                        {item.isCritical && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.role}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-bold text-slate-900">{item.type}</p>
                   <p className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-widest mt-0.5">
                    {new Date(item.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {new Date(item.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                   </p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Intelligence Body */}
      <div className="p-8 bg-slate-50/50 flex-1 space-y-8">
         
         {/* Capacity Metrics */}
         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Capacity</span>
                  <span className="text-[14px] font-black text-slate-900">{stats.availableCapacity}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.availableCapacity < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${stats.availableCapacity}%` }} 
                  />
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill Coverage</span>
                  <span className="text-[14px] font-black text-slate-900">{stats.skillCoverage}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.skillCoverage}%` }} 
                  />
               </div>
            </div>
         </div>

         {/* Impact Insights */}
         <div className="flex items-center gap-6 p-4 bg-white border border-slate-100 rounded-2xl">
            <div className="flex-1 space-y-1">
               <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Productivity Impact</span>
               </div>
               <p className="text-[10px] font-medium text-slate-400">Estimated throughput reduction during peak absence window.</p>
            </div>
            <div className="text-[20px] font-black text-rose-500">{stats.productivityImpact}%</div>
         </div>

         {/* Recommendation Panel */}
         <div className="space-y-3">
            <div className="flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-amber-500" />
               <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Mitigation Recommendations</h4>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
               <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-[12px] font-bold text-amber-900 leading-tight">
                    Delegate payroll approvals to <span className="underline decoration-amber-300">Grace Okafor</span> during Sarah's absence.
                  </p>
               </div>
               <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-[12px] font-bold text-amber-900 leading-tight">
                    Postpone non-critical Q2 audit reviews until after May 20th.
                  </p>
               </div>
            </div>
         </div>

         {/* Strategic Actions */}
         <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="h-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
               <ArrowRightLeft className="w-3 h-3" />
               Reassign Tasks
            </button>
            <button className="h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-300 transition-all flex items-center justify-center gap-2">
               <ShieldCheck className="w-3 h-3 text-indigo-500" />
               Delegate Auth
            </button>
         </div>
      </div>
    </div>
  );
};

const ArrowRightLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
);
