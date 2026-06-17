"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  Target, 
  Briefcase, 
  ShieldCheck, 
  X, 
  Plus, 
  Trash2, 
  Edit3,
  Globe,
  Layers,
  Zap,
  CreditCard,
  PieChart
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useFinance, Expenditure, ProjectFunding } from '@/context/FinanceContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { Select } from '../forms/Select';

// --- Finance Modals ---

export const CreateExpenditureModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addExpenditure } = useFinance();
  const { hubs, departments } = useOrganization();
  const { employees } = useWorkforce();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('OPEX');
  const [hub, setHub] = useState(hubs[0]?.name || '');
  const [department, setDepartment] = useState(departments[0]?.name || '');
  const [requestedBy, setRequestedBy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenditure({ 
      description, 
      amount: parseFloat(amount), 
      category, 
      hub, 
      department, 
      requestedBy 
    });
    onClose();
    setDescription('');
    setAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize Expenditure Request" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
            <input aria-label="Description" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Inventory Procurement Q3"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (₦)</label>
              <input aria-label="Amount (₦)" 
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              />
            </div>
            <Select
                label="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { label: 'Operational Exp (OPEX)', value: 'OPEX' },
                  { label: 'Capital Exp (CAPEX)', value: 'CAPEX' },
                  { label: 'Procurement', value: 'PROCUREMENT' },
                  { label: 'Petty Cash', value: 'PETTY_CASH' },
                ]}
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Select 
               label="Regional Hub"
               value={hub}
               onChange={setHub}
               options={hubs.filter(h => h.id !== 'HUB-00').map(h => ({ label: h.name, value: h.name }))}
             />
             <Select 
               label="Departmental Unit"
               value={department}
               onChange={setDepartment}
               options={departments.filter(d => d.hub?.name === hub).map(d => ({ label: d.name, value: d.name }))}
             />
          </div>
          <Select 
            label="Requested By (Personnel)"
            value={requestedBy}
            onChange={setRequestedBy}
            options={employees.filter(emp => emp.hub === hub).map(emp => ({ label: `${emp.name} (${emp.role})`, value: emp.id }))}
          />
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
        >
          Submit for Approval
        </button>
      </form>
    </Modal>
  );
};

export const AllocateProjectFundingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { allocateProjectFunds } = useFinance();
  const { hubs } = useOrganization();
  
  const [projectName, setProjectName] = useState('');
  const [allocation, setAllocation] = useState('');
  const [hub, setHub] = useState(hubs[0]?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    allocateProjectFunds({ 
      projectName, 
      allocation: parseFloat(allocation), 
      utilized: 0, 
      hub 
    });
    onClose();
    setProjectName('');
    setAllocation('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Project Funding" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
            <input aria-label="Project Name" 
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. New Hub Infrastructure"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Total Funding (₦)</label>
              <input aria-label="Total Funding (₦)" 
                required
                type="number"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                placeholder="0.00"
                className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <Select 
              label="Regional Hub Context"
              value={hub}
              onChange={setHub}
              options={hubs.filter(h => h.id !== 'HUB-00').map(h => ({ label: h.name, value: h.name }))}
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Initialize Funding
        </button>
      </form>
    </Modal>
  );
};
