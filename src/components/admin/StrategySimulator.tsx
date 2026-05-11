"use client";

import React, { useState, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  Target, 
  TrendingUp, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  Maximize2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useWorkforce } from '@/context/WorkforceContext';
import { useForecasting } from '@/context/ForecastingContext';

export const StrategySimulator: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { employees } = useWorkforce();
  const { stressIndex: realStressIndex } = useForecasting();
  
  const [sandboxEmployees, setSandboxEmployees] = useState([...employees]);
  const [simulatedStressIndex, setSimulatedStressIndex] = useState(realStressIndex);
  const [isSimulating, setIsSimulating] = useState(false);

  const calculateSimulatedStress = (emps: any[]) => {
    // Simplified version of the forecasting algorithm for real-time sandbox feedback
    const total = emps.length;
    const pending = emps.filter(e => e.status === 'PENDING').length;
    const base = (pending / total) * 100;
    return Math.min(100, Math.round(base * 1.5));
  };

  const handleSimulateRemoval = (id: string) => {
    const nextEmps = sandboxEmployees.filter(e => e.id !== id);
    setSandboxEmployees(nextEmps);
    setSimulatedStressIndex(calculateSimulatedStress(nextEmps));
  };

  const resetSandbox = () => {
    setSandboxEmployees([...employees]);
    setSimulatedStressIndex(realStressIndex);
  };

  const executeStrategy = () => {
    setIsSimulating(true);
    // In a real app, this would commit the sandbox to the production registry
    setTimeout(() => {
      setIsSimulating(false);
      onClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Strategy Simulator"
      subtitle="Enterprise Sandbox: Model Organizational Shifts & Impact Scenarios"
      size="xl"
    >
      <div className="space-y-10 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Simulator Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col justify-between h-[200px] shadow-2xl shadow-slate-900/20">
              <div className="flex items-center gap-2 text-slate-400">
                 <Zap className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Simulated Stress</span>
              </div>
              <div>
                 <span className="text-5xl font-black tracking-tighter">{simulatedStressIndex}%</span>
                 <div className="flex items-center gap-2 mt-1">
                    {simulatedStressIndex > realStressIndex ? (
                       <TrendingUp className="w-4 h-4 text-rose-500" />
                    ) : (
                       <TrendingUp className="w-4 h-4 text-emerald-500 rotate-180" />
                    )}
                    <span className={`text-[11px] font-bold ${simulatedStressIndex > realStressIndex ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {simulatedStressIndex - realStressIndex}% from baseline
                    </span>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-indigo-600 rounded-[32px] text-white flex flex-col justify-between h-[200px] shadow-2xl shadow-indigo-600/20">
              <div className="flex items-center gap-2 text-indigo-200">
                 <Target className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Projected Headcount</span>
              </div>
              <div>
                 <span className="text-5xl font-black tracking-tighter">{sandboxEmployees.length}</span>
                 <span className="text-[13px] font-medium text-indigo-100/60 block mt-1">Simulated Workforce Capacity</span>
              </div>
           </div>

           <div className="p-8 bg-white border border-slate-200 rounded-[32px] flex flex-col justify-between h-[200px]">
              <div className="flex items-center gap-2 text-slate-400">
                 <ShieldAlert className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Compliance Drift</span>
              </div>
              <div>
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">Minimal</span>
                 <p className="text-[11px] text-slate-400 font-medium leading-tight mt-2">
                    Current sandbox configuration maintains standard regulatory ratios.
                 </p>
              </div>
        </div>
        </div>

        {/* Sandbox Canvas */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <Maximize2 className="w-4 h-4 text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Sandbox Canvas</span>
              </div>
              <button 
                onClick={resetSandbox}
                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-all"
              >
                 <RotateCcw className="w-3.5 h-3.5" />
                 Reset to Production
              </button>
           </div>

           <div className="max-h-[400px] overflow-y-auto pr-4 space-y-3 custom-scrollbar">
              {sandboxEmployees.slice(0, 10).map((emp) => (
                <div key={emp.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[13px] font-black text-slate-400">
                         {emp.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                         <p className="text-[13px] font-black text-slate-900">{emp.name}</p>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{emp.role}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{emp.hub}</span>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleSimulateRemoval(emp.id)}
                     className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing Top 10 Optimization Candidates</p>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                 <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Strategy Execution Warning</p>
                 <p className="text-[10px] font-medium text-slate-400">Committing this strategy will trigger a global rebalance and Guardian Protocol clearance.</p>
              </div>
           </div>
           
           <button 
             onClick={executeStrategy}
             disabled={isSimulating}
             className="h-[52px] px-10 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3 disabled:opacity-50"
           >
              {isSimulating ? (
                 <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                 <Play className="w-4 h-4" />
              )}
              {isSimulating ? 'Executing Strategy...' : 'Execute Strategy'}
              {!isSimulating && <ArrowRight className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </Modal>
  );
};
