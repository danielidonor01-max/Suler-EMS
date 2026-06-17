"use client";

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hubId, setHubId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Default the selects on first open + when hubs/depts load.
  React.useEffect(() => {
    if (!isOpen) return;
    if (!hubId && hubs[0]) setHubId(hubs[0].id);
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id);
  }, [isOpen, hubs, departments, hubId, departmentId]);

  // Filter the department picker to the chosen hub so the org tree is
  // internally consistent — a team can't belong to "Lagos Operations
  // Department" while sitting under the Abuja hub.
  const filteredDepts = departments.filter(d => !hubId || d.hub?.id === hubId || !d.hub);
  // Manager picker: any active employee, but suggest those whose branch
  // matches the selected hub first via a label hint.
  const selectedHubName = hubs.find(h => h.id === hubId)?.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addTeam({
        code: code.toUpperCase(),
        name,
        description: description || null,
        hubId: hubId || null,
        departmentId: departmentId || null,
        managerId: managerId || null,
        // Seed the manager as the first member (with Lead role) when they
        // accept the role — saves a follow-up "add member" click.
        members: managerId ? [{ employeeId: managerId, role: 'Lead' }] : [],
      });
      onClose();
      setCode(''); setName(''); setDescription(''); setManagerId('');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create team');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish Operational Team" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Code</label>
          <input
            aria-label="Team Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TEAM-FRONT-01"
            className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Identity</label>
          <input
            aria-label="Team Identity"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend Engineering"
            className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Description</label>
          <textarea
            aria-label="Strategic Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly define the team mission..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-medium outline-none focus:border-indigo-500 transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Hub"
            value={hubId}
            onChange={setHubId}
            options={[
              { label: '— Unassigned —', value: '' },
              ...hubs.map(h => ({ label: h.name, value: h.id })),
            ]}
          />
          <Select
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={[
              { label: '— Unassigned —', value: '' },
              ...filteredDepts.map(d => ({ label: d.name, value: d.id })),
            ]}
          />
        </div>
        <Select
          label={`Team Manager${selectedHubName ? ` (${selectedHubName} suggested)` : ''}`}
          value={managerId}
          onChange={setManagerId}
          options={[
            { label: '— Unassigned —', value: '' },
            ...employees.map(emp => ({ label: `${emp.name} (${emp.role ?? emp.designation ?? ''})`, value: emp.id })),
          ]}
        />
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md disabled:opacity-60"
        >
          {busy ? 'Initializing…' : 'Initialize Team'}
        </button>
      </form>
    </Modal>
  );
};

export const AddMemberModal: React.FC<{ isOpen: boolean; onClose: () => void; team: Team }> = ({ isOpen, onClose, team }) => {
  const { addMemberToTeam } = useTeams();
  const { employees } = useWorkforce();
  const [selectedMember, setSelectedMember] = useState('');
  const [role, setRole] = useState<'Contributor' | 'Lead'>('Contributor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (isOpen) { setSelectedMember(''); setRole('Contributor'); setError(null); }
  }, [isOpen, team.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError(null);
    setBusy(true);
    try {
      await addMemberToTeam(team.id, selectedMember, role);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not add member');
    } finally {
      setBusy(false);
    }
  };

  // Filter to active employees not already on the team. Hub match is no
  // longer a hard constraint — cross-hub teams are common (e.g. a global
  // working group), so we just exclude already-on-team employees.
  const memberEmployeeIds = new Set(team.members.map(m => m.employee.id));
  const availableEmployees = employees.filter(emp => !memberEmployeeIds.has(emp.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Team</p>
          <h4 className="text-[14px] font-bold text-slate-900">{team.name}</h4>
          {team.hub && (
            <p className="text-[11px] text-slate-500 mt-1">Hub: {team.hub.name}</p>
          )}
        </div>
        <Select
          label="Select Personnel"
          value={selectedMember}
          onChange={setSelectedMember}
          placeholder="Choose employee…"
          options={availableEmployees.map(emp => ({ label: `${emp.name} (${emp.role ?? emp.designation ?? ''})`, value: emp.id }))}
        />
        <Select
          label="Role in Team"
          value={role}
          onChange={(v: string) => setRole(v === 'Lead' ? 'Lead' : 'Contributor')}
          options={[
            { label: 'Contributor', value: 'Contributor' },
            { label: 'Lead',        value: 'Lead' },
          ]}
        />
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !selectedMember}
          className="w-full h-12 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-60"
        >
          {busy ? 'Adding…' : 'Add to Roster'}
        </button>
      </form>
    </Modal>
  );
};
