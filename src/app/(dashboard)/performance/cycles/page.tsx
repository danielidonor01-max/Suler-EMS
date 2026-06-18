"use client";

import React, { useState } from 'react';
import {
  Target, Plus, Calendar, CheckCircle2, Clock, AlertTriangle,
  Users, ArrowRight, Trash2, PlayCircle, X,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { Modal } from '@/components/common/Modal';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RouteGuard } from '@/components/common/RouteGuard';
import Link from 'next/link';

interface CycleRow {
  id: string;
  name: string;
  type: 'QUARTERLY' | 'ANNUAL' | 'MID_YEAR' | 'AD_HOC';
  startDate: string;
  endDate: string;
  dueDate: string | null;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  description: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  reviewCount: number;
  statusCounts: Record<string, number>;
}

const TYPE_LABEL: Record<string, string> = {
  QUARTERLY: 'Quarterly',
  ANNUAL:    'Annual',
  MID_YEAR:  'Mid-Year',
  AD_HOC:    'Ad-Hoc',
};

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  DRAFT:  { text: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
  OPEN:   { text: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  CLOSED: { text: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-100' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function CyclesPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <CyclesInner />
    </RouteGuard>
  );
}

function CyclesInner() {
  const { data: cycles = [], refresh } = useApi<CycleRow[]>('/api/performance/cycles', { pollMs: 30_000 });
  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState<CycleRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = {
    open:    cycles.filter(c => c.status === 'OPEN').length,
    draft:   cycles.filter(c => c.status === 'DRAFT').length,
    closed:  cycles.filter(c => c.status === 'CLOSED').length,
    pending: cycles.reduce((sum, c) => sum + (c.statusCounts.PENDING ?? 0) + (c.statusCounts.IN_PROGRESS ?? 0), 0),
  };

  const openCycle = async (cycle: CycleRow) => {
    if (!confirm(`Open "${cycle.name}" for review? Reviewers will see assigned reviews in their queue.`)) return;
    try {
      await apiMutate(`/api/performance/cycles/${cycle.id}`, 'PATCH', { status: 'OPEN' });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not open cycle');
    }
  };

  const closeCycle = async (cycle: CycleRow) => {
    if (!confirm(`Close "${cycle.name}"? No further submissions or acknowledgments will be possible.`)) return;
    try {
      await apiMutate(`/api/performance/cycles/${cycle.id}`, 'PATCH', { status: 'CLOSED' });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not close cycle');
    }
  };

  const deleteCycle = async (cycle: CycleRow) => {
    if (!confirm(`Delete "${cycle.name}" and all ${cycle.reviewCount} reviews under it? Cannot be undone.`)) return;
    try {
      await apiMutate(`/api/performance/cycles/${cycle.id}`, 'DELETE');
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete cycle');
    }
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Review Cycles
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Performance Review Cycles
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[540px]">
              Create a cycle, assign reviewers in bulk, open it for submissions, close it when the window ends.
              Reviewers act from their <strong>Performance &rarr; Reviews to Conduct</strong> tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Cycle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Open Cycles" value={`${stats.open}`}    variant="tonal-success" icon={PlayCircle} />
        <MetricCard label="Drafts"      value={`${stats.draft}`}   variant="tonal-info"    icon={Calendar} />
        <MetricCard label="In Progress" value={`${stats.pending}`} variant="tonal-warning" icon={Clock} />
        <MetricCard label="Closed"      value={`${stats.closed}`}  variant="tonal-info"    icon={CheckCircle2} />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{error}</span>
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No cycles yet</h3>
          <p className="text-[13px] text-slate-500 max-w-[400px] mx-auto">
            Create your first cycle (e.g. &ldquo;Q3 2026 Annual Review&rdquo;) to start the performance review process.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Cycle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cycles.map(c => (
            <CycleCard
              key={c.id}
              cycle={c}
              onAssign={() => setAssigning(c)}
              onOpen={() => openCycle(c)}
              onClose={() => closeCycle(c)}
              onDelete={() => deleteCycle(c)}
            />
          ))}
        </div>
      )}

      <CreateCycleModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); refresh(); }}
      />
      <AssignModal
        cycle={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={() => { setAssigning(null); refresh(); }}
      />
    </div>
  );
}

function CycleCard({
  cycle, onAssign, onOpen, onClose, onDelete,
}: {
  cycle: CycleRow;
  onAssign: () => void;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const tone = STATUS_TONE[cycle.status];
  const submitted = cycle.statusCounts.SUBMITTED ?? 0;
  const acknowledged = cycle.statusCounts.ACKNOWLEDGED ?? 0;
  const done = submitted + acknowledged;
  const pct = cycle.reviewCount > 0 ? Math.round((done / cycle.reviewCount) * 100) : 0;

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{cycle.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
              {cycle.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{TYPE_LABEL[cycle.type]}</span>
            <span className="text-[10px] font-bold text-slate-400">
              {fmtDate(cycle.startDate)} – {fmtDate(cycle.endDate)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete cycle"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {cycle.description && (
        <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{cycle.description}</p>
      )}

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Total" value={cycle.reviewCount} />
        <Stat label="Pending" value={cycle.statusCounts.PENDING ?? 0} />
        <Stat label="In Progress" value={cycle.statusCounts.IN_PROGRESS ?? 0} />
        <Stat label="Done" value={done} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion</span>
          <span className="text-[13px] font-bold text-slate-900">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            ref={(el) => { if (el) el.style.width = `${pct}%`; }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <Link
          href={`/performance/cycles/${cycle.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
        >
          <Users className="w-3 h-3" />
          View Reviews
        </Link>
        {cycle.status === 'DRAFT' && (
          <>
            <button
              type="button"
              onClick={onAssign}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              <Users className="w-3 h-3" />
              Assign
            </button>
            <button
              type="button"
              onClick={onOpen}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              <PlayCircle className="w-3 h-3" />
              Open Cycle
              <ArrowRight className="w-3 h-3" />
            </button>
          </>
        )}
        {cycle.status === 'OPEN' && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            <X className="w-3 h-3" />
            Close Cycle
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 bg-slate-50 rounded-lg">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-[14px] font-bold text-slate-900">{value}</div>
    </div>
  );
}

function CreateCycleModal({
  isOpen, onClose, onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'QUARTERLY' | 'ANNUAL' | 'MID_YEAR' | 'AD_HOC'>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setName(''); setType('ANNUAL'); setStartDate(''); setEndDate('');
    setDueDate(''); setDescription(''); setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/performance/cycles', 'POST', {
        name, type,
        startDate, endDate,
        dueDate: dueDate || null,
        description: description || null,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? 'Could not create cycle');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Review Cycle" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 2026 Annual Review"
            aria-label="Cycle name"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              aria-label="Type"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="MID_YEAR">Mid-Year</option>
              <option value="AD_HOC">Ad-Hoc</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Due date"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
            <input
              type="date" required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Start date"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
            <input
              type="date" required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="End date"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Context for reviewers — e.g. focus areas, rating scale guidance."
            aria-label="Description"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Creating…' : 'Create Cycle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({
  cycle, onClose, onAssigned,
}: {
  cycle: CycleRow | null;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  React.useEffect(() => { if (cycle) { setError(null); setFlash(null); } }, [cycle]);
  if (!cycle) return null;

  const assignAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiMutate<{ assignAll: boolean }, { assignedCount: number; requestedCount: number }>(
        `/api/performance/cycles/${cycle.id}/assign`, 'POST', { assignAll: true } as any,
      );
      setFlash(`${res.assignedCount} of ${res.requestedCount} new reviews created. Existing rows untouched.`);
      onAssigned();
    } catch (err: any) {
      setError(err?.message ?? 'Assign failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={!!cycle} onClose={onClose} title="Assign Reviews" size="sm">
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{cycle.name}</h3>
            <p className="text-[12px] text-slate-500 mt-1 max-w-[320px]">
              Create a review row for every active employee. Reviewer assignment can be done per-row later
              from the cycle detail view. Idempotent — re-running just adds the newcomers.
            </p>
          </div>
        </div>

        {flash && (
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-emerald-700">{flash}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            Close
          </button>
          <button type="button" onClick={assignAll} disabled={busy}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Assigning…' : 'Assign All Active'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
