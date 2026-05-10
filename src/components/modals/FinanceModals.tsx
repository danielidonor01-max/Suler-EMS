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
            <input 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Office Stationery Q3"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                <option value="OPEX">Operational Exp (OPEX)</option>
                <option value="CAPEX">Capital Exp (CAPEX)</option>
                <option value="PROCUREMENT">Procurement</option>
                <option value="PETTY_CASH">Petty Cash</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub</label>
              <select 
                value={hub}
                onChange={(e) => setHub(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                {hubs.filter(h => h.id !== 'HUB-00').map(h => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                {departments.filter(d => d.parentHub === hub).map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested By</label>
            <select 
              required
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
            >
              <option value="">Select Personnel</option>
              {employees.filter(emp => emp.hub === hub).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
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
            <input 
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. New Office Fit-out"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Funding (₦)</label>
              <input 
                required
                type="number"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Hub</label>
              <select 
                value={hub}
                onChange={(e) => setHub(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none"
              >
                {hubs.filter(h => h.id !== 'HUB-00').map(h => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
              </select>
            </div>
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
