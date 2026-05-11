"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  X, 
  Plus, 
  Trash2, 
  Edit3,
  Globe,
  Layers
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useOrganization, Hub, Department } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';

// --- Hub Modals ---

export const CreateHubModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addHub } = useOrganization();
  const [name, setName] = useState('');
  const [geography, setGeography] = useState('');
  const [category, setCategory] = useState('Regional Hub');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addHub({ name, geography, category });
    onClose();
    setName('');
    setGeography('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish Regional Hub" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Identity</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos Headquarters"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geographical Context</label>
            <input 
              required
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g. Nigeria (South-West)"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            >
              <option>Primary HQ</option>
              <option>Regional Operations</option>
              <option>Satellite Branch</option>
              <option>International Liaison</option>
            </select>
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Initialize Hub
        </button>
      </form>
    </Modal>
  );
};

export const EditHubModal: React.FC<{ isOpen: boolean; onClose: () => void; hub: Hub }> = ({ isOpen, onClose, hub }) => {
  const { updateHub } = useOrganization();
  const [name, setName] = useState(hub.name);
  const [geography, setGeography] = useState(hub.geography);
  const [category, setCategory] = useState(hub.category);
  const [manager, setManager] = useState(hub.manager || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHub(hub.id, { name, geography, category, manager });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Hub Identity" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geography</label>
            <input 
              required
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager Assignment</label>
            <input 
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="Assign Principal Staff"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Synchronize Configuration
        </button>
      </form>
    </Modal>
  );
};

// --- Department Modals ---

export const CreateDepartmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addDepartment, hubs } = useOrganization();
  const [name, setName] = useState('');
  const [lead, setLead] = useState('');
  const [parentHub, setParentHub] = useState(hubs[0]?.name || '');
  const [reportingLine, setReportingLine] = useState('Executive Office');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDepartment({ name, lead, parentHub, reportingLine });
    onClose();
    setName('');
    setLead('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Define Operational Unit" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Identity</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Talent Acquisition"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent Operational Hub</label>
            <select 
              value={parentHub}
              onChange={(e) => setParentHub(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            >
              {hubs.filter(h => h.id !== 'HUB-00').map(hub => (
                <option key={hub.id} value={hub.name}>{hub.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Functional Lead</label>
            <input 
              required
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="e.g. Sarah Williams"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Initialize Department
        </button>
      </form>
    </Modal>
  );
};

export const EditDepartmentModal: React.FC<{ isOpen: boolean; onClose: () => void; dept: Department }> = ({ isOpen, onClose, dept }) => {
  const { updateDepartment, hubs } = useOrganization();
  const [name, setName] = useState(dept.name);
  const [lead, setLead] = useState(dept.lead);
  const [parentHub, setParentHub] = useState(dept.parentHub);
  const [reportingLine, setReportingLine] = useState(dept.reportingLine);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDepartment(dept.id, { name, lead, parentHub, reportingLine });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mutate Departmental Scope" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Hub</label>
            <select 
              value={parentHub}
              onChange={(e) => setParentHub(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            >
              {hubs.filter(h => h.id !== 'HUB-00').map(hub => (
                <option key={hub.id} value={hub.name}>{hub.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principal Lead</label>
            <input 
              required
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Synchronize Changes
        </button>
      </form>
    </Modal>
  );
};
