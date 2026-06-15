"use client";

import React, { useState } from 'react';
import { 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSettings, SalaryBand } from '@/context/SettingsContext';

export const AddSalaryGradeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { updateSettings, settings } = useSettings();
  
  const [level, setLevel] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [stepIncrement, setStepIncrement] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBand: SalaryBand = {
      id: `B-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      level,
      minSalary: parseFloat(minSalary),
      maxSalary: parseFloat(maxSalary),
      stepIncrement: parseFloat(stepIncrement) || 0
    };

    updateSettings(prev => ({
      ...prev,
      salaryBands: [...prev.salaryBands, newBand]
    }));
    
    onClose();
    setLevel('');
    setMinSalary('');
    setMaxSalary('');
    setStepIncrement('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Define New Salary Grade" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Grade Level Identifier</label>
            <input aria-label="Grade Level Identifier" 
              required
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g. Level 12 (Executive)"
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Minimum Base (₦)</label>
               <input aria-label="Minimum Base (₦)" 
                 required
                 type="number"
                 value={minSalary}
                 onChange={(e) => setMinSalary(e.target.value)}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Maximum Base (₦)</label>
               <input aria-label="Maximum Base (₦)" 
                 required
                 type="number"
                 value={maxSalary}
                 onChange={(e) => setMaxSalary(e.target.value)}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Annual Step Increment (₦)</label>
            <input aria-label="Annual Step Increment (₦)" 
              required
              type="number"
              value={stepIncrement}
              onChange={(e) => setStepIncrement(e.target.value)}
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full h-[48px] bg-slate-950 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Commit Grade to Registry
        </button>
      </form>
    </Modal>
  );
};
