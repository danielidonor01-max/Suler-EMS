"use client";

import React, { useState } from 'react';
import { 
  Users, 
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
  UserPlus
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useTeams, Team } from '@/context/TeamContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { Select } from '../forms/Select';

// --- Team Modals ---

export const CreateTeamModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTeam } = useTeams();
  const { hubs, departments } = useOrganization();
  const { employees } = useWorkforce();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hub, setHub] = useState(hubs[0]?.name || '');
  const [department, setDepartment] = useState(departments[0]?.name || '');
  const [managerId, setManagerId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTeam({ name, description, hub, department, managerId, members: [managerId].filter(Boolean) });
    onClose();
    setName('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish Operational Team" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Identity</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Engineering"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly define the team mission..."
              className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Hub"
              value={hub}
              onChange={setHub}
              options={hubs.filter(h => h.id !== 'HUB-00').map(h => ({ label: h.name, value: h.name }))}
            />
            <Select
              label="Department"
              value={department}
              onChange={setDepartment}
              options={departments.filter(d => d.parentHub === hub).map(d => ({ label: d.name, value: d.name }))}
            />
          </div>
          <Select
            label="Team Manager"
            value={managerId}
            onChange={setManagerId}
            placeholder="Select Manager"
            options={employees.filter(emp => emp.hub === hub).map(emp => ({ label: `${emp.name} (${emp.role})`, value: emp.id }))}
          />
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Initialize Team
        </button>
      </form>
    </Modal>
  );
};

export const AddMemberModal: React.FC<{ isOpen: boolean; onClose: () => void; team: Team }> = ({ isOpen, onClose, team }) => {
  const { addMemberToTeam } = useTeams();
  const { employees } = useWorkforce();
  const [selectedMember, setSelectedMember] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMember) {
      addMemberToTeam(team.id, selectedMember);
      onClose();
    }
  };

  const availableEmployees = employees.filter(emp => 
    emp.hub === team.hub && !team.members.includes(emp.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
           <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Team</p>
              <h4 className="text-[14px] font-bold text-slate-900">{team.name}</h4>
           </div>
           <Select
            label="Select Personnel"
            value={selectedMember}
            onChange={setSelectedMember}
            placeholder="Choose employee..."
            options={availableEmployees.map(emp => ({ label: `${emp.name} (${emp.role})`, value: emp.id }))}
          />
        </div>
        <button 
          type="submit"
          className="w-full h-12 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
        >
          Add to Roster
        </button>
      </form>
    </Modal>
  );
};
