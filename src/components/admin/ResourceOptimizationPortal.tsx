"use client";

import React from 'react';
import { 
  BarChart3, 
  ArrowRightLeft, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  BrainCircuit,
  ArrowRight,
  Target
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useForecasting, StaffingProposal } from '@/context/ForecastingContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useMutation } from '@/hooks/useMutation';

export const ResourceOptimizationPortal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { proposals } = useForecasting();
  const { updateEmployee } = useWorkforce();
  
  const { mutate: authorizeRebalance } = useMutation(
    async (proposal: StaffingProposal) => {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1500));
      return updateEmployee(proposal.employeeId, { office: proposal.targetHub });
    },
    {
      activityLabel: 'Autonomous Rebalance Authorized',
      activityType: 'GOVERNANCE',
      successMessage: 'Strategic workforce migration successful. Regional density optimized.',
      requiresApproval: true, // Rebalancing requires secondary clearance
      approvalLabel: 'Regional Staffing Rebalance'
    }
  );
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Resource Optimization"
      subtitle="AI-Driven Workforce Balancing & Regional Hub Optimization"
      size="xl"
    >
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
        
        {/* Intelligence Header */}
        <div className="p-8 bg-indigo-600 rounded-[32px] text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-indigo-200">
                    <BrainCircuit className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Optimization Engine Active</span>
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">Regional Capacity Balancing</h3>
                 <p className="text-[13px] text-indigo-100/70 font-medium max-w-[440px]">
                    The Resource Allocation Engine has identified structural imbalances in regional workforce density. Strategic reallocation recommended to optimize operational throughput.
                 </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-1">Global Efficiency</span>
                    <span className="text-3xl font-black">84%</span>
                 </div>
                 <div className="w-px h-12 bg-indigo-400" />
                 <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-1">Projected Gain</span>
                    <span className="text-3xl font-black text-emerald-300">+12%</span>
                 </div>
              </div>
           </div>
           
        </div>

        {/* Recommendations Stream */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <Target className="w-4 h-4 text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Targeted Reallocations</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Updated 4m ago</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposals.map((rec) => (
                <div key={rec.id} className="p-7 bg-white border border-slate-200 rounded-[28px] hover:border-indigo-300 hover:shadow-xl transition-all group cursor-pointer">
                   <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                         {rec.id}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                         <TrendingUp className="w-4 h-4" />
                         <span className="text-[11px] font-black">92% Impact</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="space-y-1">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">From Hub</span>
                         <h4 className="text-[14px] font-black text-slate-900">{rec.sourceHub}</h4>
                      </div>
                      <ArrowRightLeft className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                      <div className="space-y-1 text-right">
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">To Hub</span>
                         <h4 className="text-[14px] font-black text-slate-900">{rec.targetHub}</h4>
                      </div>
                   </div>

                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                         <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Optimization Rational</span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic">
                         "{rec.rationale}"
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate: {rec.employeeName}</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => authorizeRebalance(rec)}
                     className="w-full h-[48px] bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                      Authorize Reallocation
                      <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              ))}
              {proposals.length === 0 && (
                <div className="col-span-2 py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                   </div>
                   <h4 className="text-[15px] font-black text-slate-900 uppercase tracking-tight mb-1">Equilibrium Achieved</h4>
                   <p className="text-[12px] text-slate-400 font-medium max-w-[280px]">
                      The optimization engine detects no structural imbalances across regional hubs at this time.
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Global Strategy Footer */}
        <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Decision Model: Deterministic Resource Balancing</span>
           </div>
           <button 
             onClick={onClose}
             className="text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-colors"
           >
             Close Optimization View
           </button>
        </div>
      </div>
    </Modal>
  );
};
