"use client";

import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  Target, 
  ShieldCheck, 
  X, 
  Plus, 
  Trash2, 
  Edit3,
  Globe,
  Layers,
  Zap,
  CreditCard,
  PieChart,
  Award,
  MinusCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Building2,
  UserCheck,
  Calculator
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePayroll, SalaryStructure, BulkAdjustmentRequest } from '@/context/PayrollContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useTeams } from '@/context/TeamContext';

export const AddAdjustmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addAdjustment } = usePayroll();
  const { employees } = useWorkforce();
  
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<any>('BONUS');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('May 2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAdjustment({ 
      employeeId, 
      type, 
      label, 
      amount: parseFloat(amount), 
      period 
    });
    onClose();
    setLabel('');
    setAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Individual Adjustment" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Personnel</label>
            <select 
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjustment Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                <option value="BONUS">Bonus</option>
                <option value="AWARD">Performance Award</option>
                <option value="ALLOWANCE">Extra Allowance</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payroll Period</label>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                <option value="May 2026">May 2026</option>
                <option value="June 2026">June 2026</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Label / Justification</label>
            <input 
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Project Completion Bonus"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (₦)</label>
            <input 
              required
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
        >
          Confirm Adjustment
        </button>
      </form>
    </Modal>
  );
};

export const BulkAdjustmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addBulkAdjustments, salaries } = usePayroll();
  const { employees } = useWorkforce();
  const { hubs, departments } = useOrganization();
  const { teams } = useTeams();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BulkAdjustmentRequest>({
    type: 'BONUS',
    title: '',
    description: '',
    amount: 0,
    amountType: 'FIXED',
    period: 'May 2026',
    filters: {
      hubs: [],
      departments: [],
      teams: [],
      roles: []
    }
  });

  const matchedEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (formData.filters.hubs?.length && !formData.filters.hubs.includes(emp.hub)) return false;
      if (formData.filters.departments?.length && !formData.filters.departments.includes(emp.department)) return false;
      if (formData.filters.roles?.length && !formData.filters.roles.includes(emp.role)) return false;
      if (formData.filters.teams?.length) {
        const isInTeam = teams.some(t => formData.filters.teams?.includes(t.id) && t.members.includes(emp.id));
        if (!isInTeam) return false;
      }
      return true;
    });
  }, [employees, formData.filters, teams]);

  const totalImpact = useMemo(() => {
    return matchedEmployees.reduce((sum, emp) => {
      const salary = salaries.find(s => s.employeeId === emp.id);
      if (formData.amountType === 'PERCENTAGE' && salary) {
        return sum + (salary.baseSalary * formData.amount) / 100;
      }
      return sum + formData.amount;
    }, 0);
  }, [matchedEmployees, formData.amount, formData.amountType, salaries]);

  const handleApply = () => {
    addBulkAdjustments(formData);
    onClose();
    setStep(1);
  };

  const toggleFilter = (key: keyof typeof formData.filters, value: string) => {
    setFormData(prev => {
      const currentValue = prev.filters[key as keyof typeof prev.filters];
      const currentValues = Array.isArray(currentValue) ? currentValue : [];
      
      const nextValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        filters: {
          ...prev.filters,
          [key]: nextValues,
        },
      };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Compensation Wizard" size="xl">
      <div className="flex gap-10">
        {/* Wizard Steps indicator */}
        <div className="w-64 space-y-2 py-4">
           {[
             { id: 1, label: 'Define Adjustment', icon: Target },
             { id: 2, label: 'Select Beneficiaries', icon: Users },
             { id: 3, label: 'Impact Preview', icon: PieChart },
             { id: 4, label: 'Approval & Apply', icon: ShieldCheck }
           ].map(s => (
             <div key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step === s.id ? 'bg-slate-900 text-white' : step > s.id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step === s.id ? 'bg-white/10' : 'bg-transparent'}`}>
                   {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest">{s.label}</span>
             </div>
           ))}
        </div>

        <div className="flex-1 space-y-8 min-h-[500px] flex flex-col justify-between">
           {step === 1 && (
             <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Adjustment Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[13px] font-bold outline-none"
                      >
                         <option value="BONUS">Organizational Bonus</option>
                         <option value="ALLOWANCE">Allowance Adjustment</option>
                         <option value="DEDUCTION">Institutional Deduction</option>
                         <option value="AWARD">Performance Award</option>
                         <option value="COMPENSATION">Special Compensation</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payroll Cycle</label>
                      <select 
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[13px] font-bold outline-none"
                      >
                         <option value="May 2026">May 2026</option>
                         <option value="June 2026">June 2026</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Title</label>
                   <input 
                     placeholder="e.g. Q2 Performance Bonus"
                     value={formData.title}
                     onChange={e => setFormData({...formData, title: e.target.value})}
                     className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[13px] font-bold outline-none"
                   />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount Type</label>
                      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                         {['FIXED', 'PERCENTAGE'].map(t => (
                           <button 
                             key={t}
                             onClick={() => setFormData({...formData, amountType: t as any})}
                             className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.amountType === t ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}
                           >
                              {t}
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value ({formData.amountType === 'FIXED' ? '₦' : '%'})</label>
                      <input 
                        type="number"
                        value={formData.amount || ''}
                        onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-lg font-black outline-none"
                      />
                   </div>
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Office Hubs</label>
                      <div className="flex flex-wrap gap-2">
                         {hubs.map(h => (
                           <button 
                             key={h.id} 
                             onClick={() => toggleFilter('hubs', h.name)}
                             className={`px-4 h-10 rounded-xl text-[11px] font-bold border transition-all ${formData.filters.hubs?.includes(h.name) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                           >
                              {h.name}
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Departments</label>
                      <div className="flex flex-wrap gap-2">
                         {departments.map(d => (
                           <button 
                             key={d} 
                             onClick={() => toggleFilter('departments', d)}
                             className={`px-4 h-10 rounded-xl text-[11px] font-bold border transition-all ${formData.filters.departments?.includes(d) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                           >
                              {d}
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filter by Teams</label>
                      <div className="flex flex-wrap gap-2">
                         {teams.map(t => (
                           <button 
                             key={t.id} 
                             onClick={() => toggleFilter('teams', t.id)}
                             className={`px-4 h-10 rounded-xl text-[11px] font-bold border transition-all ${formData.filters.teams?.includes(t.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                           >
                              {t.name}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="p-6 bg-indigo-50 rounded-[28px] border border-indigo-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                         <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Matched Beneficiaries</h4>
                         <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Calculated in real-time</p>
                      </div>
                   </div>
                   <div className="text-3xl font-black text-indigo-600 tracking-tighter">{matchedEmployees.length} Personnel</div>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Financial Liability</span>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter">₦{totalImpact.toLocaleString()}</div>
                      <p className="text-[12px] text-slate-400 leading-relaxed italic">Consolidated impact on {formData.period} payroll cycle.</p>
                   </div>
                   <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 space-y-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Distribution Summary</span>
                      <div className="space-y-3">
                         {Array.from(new Set(matchedEmployees.map(e => e.hub))).map(hub => {
                           const count = matchedEmployees.filter(e => e.hub === hub).length;
                           const hubImpact = matchedEmployees.filter(e => e.hub === hub).reduce((sum, emp) => {
                             const salary = salaries.find(s => s.employeeId === emp.id);
                             return sum + (formData.amountType === 'PERCENTAGE' && salary ? (salary.baseSalary * formData.amount) / 100 : formData.amount);
                           }, 0);
                           return (
                             <div key={hub} className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                                <span className="text-slate-400">{hub} ({count})</span>
                                <span className="text-white">₦{hubImpact.toLocaleString()}</span>
                             </div>
                           );
                         })}
                      </div>
                   </div>
                </div>

                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                   {matchedEmployees.map(emp => (
                     <div key={emp.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-slate-900">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{emp.role}</span>
                           </div>
                        </div>
                        <span className="text-[12px] font-black text-indigo-600">
                           ₦{(formData.amountType === 'PERCENTAGE' ? (salaries.find(s => s.employeeId === emp.id)?.baseSalary || 0) * formData.amount / 100 : formData.amount).toLocaleString()}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {step === 4 && (
             <div className="space-y-8 animate-in slide-in-from-right-4 flex flex-col items-center justify-center text-center py-10">
                <div className="w-24 h-24 rounded-[40px] bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                   <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Ready to Commit Adjustments</h3>
                   <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[400px]">
                      By proceeding, you will apply the <strong>{formData.title}</strong> to <strong>{matchedEmployees.length} employees</strong>. This action will be recorded in the enterprise audit registry.
                   </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 w-full max-w-[400px] mt-8 flex justify-between items-center">
                   <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle Liability</span>
                      <span className="text-[18px] font-black text-slate-900">₦{totalImpact.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Cycle</span>
                      <span className="text-[18px] font-black text-indigo-600">{formData.period}</span>
                   </div>
                </div>
             </div>
           )}

           <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              <button 
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className={`h-12 px-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}
              >
                 <ChevronLeft className="w-4 h-4" />
                 Back
              </button>
              {step < 4 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.title}
                  className="h-12 px-10 bg-slate-950 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                   Continue
                   <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleApply}
                  className="h-12 px-12 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                   Apply Adjustments
                   <Zap className="w-4 h-4" />
                </button>
              )}
           </div>
        </div>
      </div>
    </Modal>
  );
};

export const UpdateSalaryModal: React.FC<{ isOpen: boolean; onClose: () => void; salary: SalaryStructure }> = ({ isOpen, onClose, salary }) => {
  const { updateSalary } = usePayroll();
  const [base, setBase] = useState(salary.baseSalary.toString());
  const [housing, setHousing] = useState(salary.housingAllowance.toString());
  const [transport, setTransport] = useState(salary.transportAllowance.toString());
  const [meal, setMeal] = useState(salary.mealAllowance.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalary({
      ...salary,
      baseSalary: parseFloat(base),
      housingAllowance: parseFloat(housing),
      transportAllowance: parseFloat(transport),
      mealAllowance: parseFloat(meal)
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modify Compensation Structure" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Salary</label>
              <input type="number" value={base} onChange={e => setBase(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Housing</label>
              <input type="number" value={housing} onChange={e => setHousing(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transport</label>
              <input type="number" value={transport} onChange={e => setTransport(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meal</label>
              <input type="number" value={meal} onChange={e => setMeal(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" />
           </div>
        </div>
        <button type="submit" className="w-full h-12 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">
           Save Structure
        </button>
      </form>
    </Modal>
  );
};
