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
            // dbId is the canonical UUID — managerId in the API is a uuid column.
            ...employees.map(emp => ({ label: `${emp.name} (${emp.role ?? emp.designation ?? ''})`, value: emp.dbId ?? emp.id })),
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

/**
 * Manage Roster — bulk add + remove in one surface.
 *
 * Replaces the old one-at-a-time AddMemberModal: HR picks any number of
 * employees via checkboxes (with live search), adds them in a single
 * action, and removes existing members inline. The POST endpoint is
 * idempotent per member, so the bulk add is a straightforward fan-out.
 */
export const AddMemberModal: React.FC<{ isOpen: boolean; onClose: () => void; team: Team }> = ({ isOpen, onClose, team }) => {
  const { teams, addMemberToTeam, removeMemberFromTeam } = useTeams();
  const { employees } = useWorkforce();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'Contributor' | 'Lead'>('Contributor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Re-read the team from context so the roster live-updates after each
  // add/remove (the `team` prop is a snapshot from when the modal opened).
  const liveTeam = teams.find(t => t.id === team.id) ?? team;

  React.useEffect(() => {
    if (isOpen) { setSelectedIds(new Set()); setSearch(''); setRole('Contributor'); setError(null); }
  }, [isOpen, team.id]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAdd = async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    setBusy(true);
    const failed: string[] = [];
    for (const employeeId of selectedIds) {
      try {
        await addMemberToTeam(liveTeam.id, employeeId, role);
      } catch {
        failed.push(employeeId);
      }
    }
    setBusy(false);
    if (failed.length > 0) {
      setError(`${failed.length} member${failed.length === 1 ? '' : 's'} could not be added. They may already be on the roster.`);
      setSelectedIds(new Set(failed));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRemove = async (employeeId: string) => {
    setError(null);
    setRemovingId(employeeId);
    try {
      await removeMemberFromTeam(liveTeam.id, employeeId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not remove member');
    } finally {
      setRemovingId(null);
    }
  };

  // Available = active employees not already on the roster. team.members
  // carries DB UUIDs; WorkforceContext `id` is the display staffId, so
  // compare against dbId (the actual UUID).
  const memberEmployeeIds = new Set(liveTeam.members.map(m => m.employee.id));
  const availableEmployees = employees
    .filter(emp => !memberEmployeeIds.has(emp.dbId ?? emp.id))
    .filter(emp => !search.trim() || emp.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Roster" subtitle={liveTeam.name} size="lg">
      <div className="space-y-6">

        {/* ── Current members ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Current Members ({liveTeam.members.length})
          </p>
          {liveTeam.members.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[12px] text-slate-400">
              No members yet — select personnel below to build the roster.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto">
              {liveTeam.members.map(m => (
                <div key={m.membershipId} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-slate-900 truncate block">{m.employee.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {m.role ?? 'Contributor'} · {m.employee.staffId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.employee.id)}
                    disabled={removingId === m.employee.id}
                    aria-label={`Remove ${m.employee.name} from team`}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {removingId === m.employee.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bulk add ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Add Personnel {selectedIds.size > 0 && <span className="text-indigo-600">— {selectedIds.size} selected</span>}
            </p>
            <div className="w-[160px]">
              <Select
                label=""
                value={role}
                onChange={(v: string) => setRole(v === 'Lead' ? 'Lead' : 'Contributor')}
                options={[
                  { label: 'As Contributor', value: 'Contributor' },
                  { label: 'As Lead',        value: 'Lead' },
                ]}
              />
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="w-full h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] outline-none focus:border-indigo-500 transition-all"
          />
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
            {availableEmployees.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-slate-400">
                {search ? 'No employees match your search.' : 'Everyone is already on this team.'}
              </div>
            ) : (
              availableEmployees.map(emp => {
                const id = emp.dbId ?? emp.id;
                const checked = selectedIds.has(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id)}
                      className="w-4 h-4 accent-indigo-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-slate-900 truncate block">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {emp.role ?? emp.designation ?? '—'}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700 leading-relaxed">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBulkAdd}
            disabled={busy || selectedIds.size === 0}
            className="flex-1 h-12 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md disabled:opacity-60"
          >
            {busy
              ? `Adding ${selectedIds.size}…`
              : selectedIds.size > 0
                ? `Add ${selectedIds.size} to Roster`
                : 'Add to Roster'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 h-12 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
