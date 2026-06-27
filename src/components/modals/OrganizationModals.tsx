"use client";

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useWorkforce } from '@/context/WorkforceContext';
import { useOrganization, Hub, Department } from '@/context/OrganizationContext';
import { Select } from '../forms/Select';
import { humanizeZodMessage } from '@/lib/forms/humanize-zod';

// --- Hub Modals ---

export const CreateHubModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addHub } = useOrganization();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [geography, setGeography] = useState('');
  const [category, setCategory] = useState('Regional Hub');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addHub({ code: code.toUpperCase(), name, geography, category });
      onClose();
      setCode(''); setName(''); setGeography('');
    } catch (err) {
      setError(humanizeZodMessage(err instanceof Error ? err.message : 'Could not create hub'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish Regional Hub" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Code</label>
            <input
              aria-label="Hub Code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. HUB-04"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Name</label>
            <input aria-label="Hub Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kano Regional"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geographical Context</label>
            <input aria-label="Geographical Context"
              required
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g. Nigeria (North-West)"
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <Select
            label="Classification"
            value={category}
            onChange={setCategory}
            options={[
              { label: 'Primary HQ', value: 'Primary HQ' },
              { label: 'Regional Operations', value: 'Regional Operations' },
              { label: 'Satellite Branch', value: 'Satellite Branch' },
              { label: 'International Liaison', value: 'International Liaison' },
            ]}
          />
          {error && <div className="text-[12px] font-medium text-rose-600 px-1 whitespace-pre-line">{error}</div>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-60"
        >
          {busy ? 'Initializing…' : 'Initialize Hub'}
        </button>
      </form>
    </Modal>
  );
};

export const EditHubModal: React.FC<{ isOpen: boolean; onClose: () => void; hub: Hub }> = ({ isOpen, onClose, hub }) => {
  const { updateHub } = useOrganization();
  const { employees } = useWorkforce();
  const [name, setName] = useState(hub.name);
  const [geography, setGeography] = useState(hub.geography);
  const [category, setCategory] = useState(hub.category);
  // managerId is the FK to Employee. Empty string means "unassigned" — the
  // API treats that as null when patching.
  const [managerId, setManagerId] = useState<string>(hub.managerId ?? hub.manager?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await updateHub(hub.id, {
        name, geography, category,
        managerId: managerId || null,
      });
      onClose();
    } catch (err) {
      setError(humanizeZodMessage(err instanceof Error ? err.message : 'Could not update hub'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Hub Identity" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hub Name</label>
            <input aria-label="Hub Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Geography</label>
             <input aria-label="Geography"
               required
               value={geography}
               onChange={(e) => setGeography(e.target.value)}
               className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
             />
          </div>
          <Select
            label="Classification"
            value={category}
            onChange={setCategory}
            options={[
              { label: 'Primary HQ', value: 'Primary HQ' },
              { label: 'Regional Operations', value: 'Regional Operations' },
              { label: 'Satellite Branch', value: 'Satellite Branch' },
              { label: 'International Liaison', value: 'International Liaison' },
            ]}
          />
          <Select
            label="Manager Assignment"
            value={managerId}
            onChange={setManagerId}
            options={[
              { label: '— Unassigned —', value: '' },
              // Use the canonical UUID — the API rejects the display
              // staffId since managerId is a uuid column.
              ...employees.map(e => ({ label: e.name, value: e.dbId ?? e.id })),
            ]}
          />
          {error && <div className="text-[12px] font-medium text-rose-600 px-1 whitespace-pre-line">{error}</div>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-60"
        >
          {busy ? 'Synchronizing…' : 'Synchronize Configuration'}
        </button>
      </form>
    </Modal>
  );
};

// --- Department Modals ---

export const CreateDepartmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addDepartment, hubs } = useOrganization();
  const { employees } = useWorkforce();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hubId, setHubId] = useState<string>(hubs[0]?.id ?? '');
  const [managerId, setManagerId] = useState<string>('');
  const [reportingLine, setReportingLine] = useState('Executive Office');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addDepartment({
        code: code.toUpperCase(),
        name,
        hubId: hubId || null,
        managerId: managerId || null,
        reportingLine: reportingLine || null,
      });
      onClose();
      setCode(''); setName(''); setManagerId('');
    } catch (err) {
      setError(humanizeZodMessage(err instanceof Error ? err.message : 'Could not create department'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Define Operational Unit" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Department Code</label>
            <input
              aria-label="Department Code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TALENT"
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit Identity</label>
            <input aria-label="Unit Identity"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Talent Acquisition"
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <Select
            label="Parent Operational Hub"
            value={hubId}
            onChange={setHubId}
            options={[
              { label: '— Unassigned —', value: '' },
              ...hubs.map(hub => ({ label: hub.name, value: hub.id })),
            ]}
          />
          <Select
            label="Functional Lead"
            value={managerId}
            onChange={setManagerId}
            options={[
              { label: '— Unassigned —', value: '' },
              // Use the canonical UUID — the API rejects the display
              // staffId since managerId is a uuid column.
              ...employees.map(e => ({ label: e.name, value: e.dbId ?? e.id })),
            ]}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reports To</label>
            <input
              aria-label="Reports To"
              value={reportingLine}
              onChange={(e) => setReportingLine(e.target.value)}
              placeholder="e.g. Executive Office"
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          {error && <div className="text-[12px] font-medium text-rose-600 px-1 whitespace-pre-line">{error}</div>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-60"
        >
          {busy ? 'Initializing…' : 'Initialize Department'}
        </button>
      </form>
    </Modal>
  );
};

export const EditDepartmentModal: React.FC<{ isOpen: boolean; onClose: () => void; dept: Department }> = ({ isOpen, onClose, dept }) => {
  const { updateDepartment, hubs } = useOrganization();
  const { employees } = useWorkforce();
  const [name, setName] = useState(dept.name);
  const [hubId, setHubId] = useState<string>(dept.hubId ?? dept.hub?.id ?? '');
  const [managerId, setManagerId] = useState<string>(dept.managerId ?? dept.manager?.id ?? '');
  const [reportingLine, setReportingLine] = useState(dept.reportingLine ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await updateDepartment(dept.id, {
        name,
        hubId: hubId || null,
        managerId: managerId || null,
        reportingLine: reportingLine || null,
      });
      onClose();
    } catch (err) {
      setError(humanizeZodMessage(err instanceof Error ? err.message : 'Could not update department'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mutate Departmental Scope" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Department Name</label>
            <input aria-label="Department Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <Select
            label="Operational Hub"
            value={hubId}
            onChange={setHubId}
            options={[
              { label: '— Unassigned —', value: '' },
              ...hubs.map(hub => ({ label: hub.name, value: hub.id })),
            ]}
          />
          <Select
            label="Principal Lead"
            value={managerId}
            onChange={setManagerId}
            options={[
              { label: '— Unassigned —', value: '' },
              // Use the canonical UUID — the API rejects the display
              // staffId since managerId is a uuid column.
              ...employees.map(e => ({ label: e.name, value: e.dbId ?? e.id })),
            ]}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reports To</label>
            <input
              aria-label="Reports To"
              value={reportingLine}
              onChange={(e) => setReportingLine(e.target.value)}
              placeholder="e.g. Executive Office"
              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          {error && <div className="text-[12px] font-medium text-rose-600 px-1 whitespace-pre-line">{error}</div>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-60"
        >
          {busy ? 'Synchronizing…' : 'Synchronize Changes'}
        </button>
      </form>
    </Modal>
  );
};
