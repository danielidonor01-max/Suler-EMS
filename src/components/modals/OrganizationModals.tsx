"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  ChevronRight,
  Plus,
  Target,
  Users,
  Building,
  Loader2
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Select } from '../forms/Select';
import { useToast } from '../common/ToastContext';

import { useOrganization } from '@/context/OrganizationContext';

interface CreateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateHubModal = React.memo(({ isOpen, onClose }: CreateHubModalProps) => {
  const [name, setName] = useState('');
  const [geography, setGeography] = useState('Nigeria (South-South)');
  const [category, setCategory] = useState('Primary HQ');
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const { addHub } = useOrganization();

  const handleInitialize = () => {
    if (!name) {
      toast({ type: 'error', message: 'Identity Required', description: 'Please specify a hub designation.' });
      return;
    }

    setIsInitializing(true);
    toast({
      type: 'loading',
      message: 'Initializing Hub...',
      description: 'Establishing organizational baseline and governance matrix.'
    });

    setTimeout(() => {
      addHub({ name, geography, category });
      setIsInitializing(false);
      onClose();
      toast({
        type: 'success',
        message: 'Regional Hub Established',
        description: 'Organizational architecture synchronized successfully.'
      });
      setName('');
    }, 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Establish New Regional Hub" 
      subtitle="Organizational Architecture"
      size="md"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Hub Name</label>
               <input 
                 type="text" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="e.g. Port Harcourt Operations"
                 className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
               />
            </div>
            {/* ... rest of the Hub modal ... */}
            <div className="grid grid-cols-2 gap-4">
               <Select 
                 label="Geography"
                 value={geography}
                 onChange={setGeography}
                 options={[
                   { label: 'Nigeria (South-South)', value: 'Nigeria (South-South)' },
                   { label: 'Nigeria (South-West)', value: 'Nigeria (South-West)' },
                   { label: 'Nigeria (North-Central)', value: 'Nigeria (North-Central)' },
                   { label: 'Remote/Global', value: 'Remote/Global' },
                 ]}
               />
               <Select 
                 label="Hub Category"
                 value={category}
                 onChange={setCategory}
                 options={[
                   { label: 'Primary HQ', value: 'Primary HQ' },
                   { label: 'Regional Operations', value: 'Regional Operations' },
                   { label: 'Satellite Branch', value: 'Satellite Branch' },
                   { label: 'Logistics Node', value: 'Logistics Node' },
                 ]}
               />
            </div>
         </div>

         <div className="p-6 bg-slate-50 border border-slate-100 rounded-[20px] space-y-4">
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-4 h-4 text-indigo-500" />
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Governance Baseline</h4>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
               New hubs are initialized with the **Suler Global Standard** permission matrix. Local overrides can be configured in the IAM Console.
            </p>
         </div>

         <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
            <button onClick={onClose} disabled={isInitializing} className="px-6 h-[44px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={handleInitialize}
              disabled={isInitializing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
               {isInitializing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initialize Hub'}
            </button>
         </div>
      </div>
    </Modal>
  );
});

interface CreateDeptModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentHub: string;
}

export const CreateDeptModal = React.memo(({ isOpen, onClose, parentHub }: CreateDeptModalProps) => {
  const [name, setName] = useState('');
  const [lead, setLead] = useState('');
  const [reportingLine, setReportingLine] = useState('Executive Office');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { addDepartment } = useOrganization();

  const handleCreate = () => {
    if (!name || !lead) {
      toast({ type: 'error', message: 'Identity Required', description: 'Please specify department name and lead.' });
      return;
    }

    setIsCreating(true);
    toast({
      type: 'loading',
      message: 'Defining Department...',
      description: `Structuring organizational hierarchy within ${parentHub}.`
    });

    setTimeout(() => {
      addDepartment({ name, lead, reportingLine, parentHub });
      setIsCreating(false);
      onClose();
      toast({
        type: 'success',
        message: 'Department Established',
        description: 'New department reporting lines synchronized.'
      });
      setName('');
      setLead('');
    }, 1500);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Define New Department" 
      subtitle={`Structuring Hub: ${parentHub}`}
      size="md"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Department Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Risk Management"
              className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
            />
         </div>

         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Department Lead</label>
               <div className="relative group">
                  <input 
                    type="text" 
                    value={lead}
                    onChange={(e) => setLead(e.target.value)}
                    placeholder="Search personnel..."
                    className="w-full h-[52px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                     <Users className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
               </div>
            </div>
            <Select 
              label="Reporting Line"
              value={reportingLine}
              onChange={setReportingLine}
              options={[
                { label: 'Executive Office', value: 'Executive Office' },
                { label: 'Operations Directorate', value: 'Operations Directorate' },
                { label: 'Human Resources', value: 'Human Resources' },
                { label: 'Finance Hub', value: 'Finance Hub' },
              ]}
            />
         </div>

         <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
            <button onClick={onClose} disabled={isCreating} className="px-6 h-[44px] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10"
            >
               {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Establish Department'}
            </button>
         </div>
      </div>
    </Modal>
  );
});
