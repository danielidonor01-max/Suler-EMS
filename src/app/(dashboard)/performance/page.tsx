"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Target, Plus, Edit3, Trash2, CheckCircle2, AlertTriangle,
  TrendingUp, Calendar, Users, FileText, ArrowRight,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { Modal } from '@/components/common/Modal';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeChip } from '@/components/employees/EmployeeChip';

// ─── API types ───────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: 'INDIVIDUAL' | 'TEAM' | 'ORGANIZATIONAL';
  startDate: string;
  dueDate: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  progressPercent: number;
  notes: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string };
  owner: { id: string; name: string; email: string };
}

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  DRAFT:     { text: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  ACTIVE:    { text: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-100' },
  COMPLETED: { text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  OVERDUE:   { text: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-100' },
  CANCELLED: { text: 'text-slate-500',   bg: 'bg-slate-50',    border: 'border-slate-100' },
};

const CATEGORY_LABEL: Record<string, string> = {
  INDIVIDUAL:     'Individual',
  TEAM:           'Team',
  ORGANIZATIONAL: 'Organizational',
};

function fmtDate(iso: string | null): string {
  if (!iso) return 'No due date';
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function PerformancePage() {
  const { userRole } = useAccess();
  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const { data: goals = [], refresh } = useApi<Goal[]>(
    `/api/performance/goals?scope=${tab}`,
    { pollMs: 30_000 },
  );

  const stats = useMemo(() => {
    let active = 0, completed = 0, overdue = 0;
    let progressSum = 0, activeCount = 0;
    for (const g of goals) {
      if (g.status === 'ACTIVE') {
        active++; activeCount++;
        progressSum += g.progressPercent;
      } else if (g.status === 'COMPLETED') {
        completed++;
      }
      if (g.isOverdue) overdue++;
    }
    return {
      active,
      completed,
      overdue,
      avgProgress: activeCount > 0 ? Math.round(progressSum / activeCount) : 0,
    };
  }, [goals]);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      {/* Hero */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Performance
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Goals &amp; Outcomes
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
              Define what you&apos;re working toward and track progress.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/performance/reviews"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
            >
              <FileText className="w-4 h-4" />
              Reviews
              <ArrowRight className="w-3 h-3" />
            </Link>
            {isHR && (
              <Link
                href="/performance/cycles"
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                <Calendar className="w-4 h-4" />
                Cycles
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              New Goal
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Active Goals"   value={`${stats.active}`}    variant="tonal-info"    icon={Target} />
        <MetricCard label="Completed"      value={`${stats.completed}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Overdue"        value={`${stats.overdue}`}   variant={stats.overdue > 0 ? 'tonal-warning' : 'tonal-success'} icon={AlertTriangle} />
        <MetricCard label="Avg Progress"   value={`${stats.avgProgress}%`} variant="tonal-info" icon={TrendingUp} />
      </div>

      {/* Tabs */}
      {isHR && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
          <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')} icon={Target} label="My Goals" />
          <TabBtn active={tab === 'all'}  onClick={() => setTab('all')}  icon={Users}  label="All Employees" />
        </div>
      )}

      {/* Goal grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Target className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No goals yet</h3>
          <p className="text-[13px] text-slate-500 max-w-[400px] mx-auto">
            Set a measurable outcome you&apos;re working toward. Goals show in HR&apos;s view too, so they can support you.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              showEmployee={tab === 'all'}
              onEdit={() => setEditing(g)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); refresh(); }}
      />
      <GoalFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
        existing={editing ?? undefined}
      />
    </div>
  );
}

// ─── Goal card ───────────────────────────────────────────────────────────────

function GoalCard({
  goal, showEmployee, onEdit, onChanged,
}: {
  goal: Goal;
  showEmployee: boolean;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const tone = STATUS_TONE[goal.isOverdue && goal.status === 'ACTIVE' ? 'OVERDUE' : goal.status] ?? STATUS_TONE.ACTIVE;
  const [updating, setUpdating] = useState(false);

  const adjustProgress = async (delta: number) => {
    const next = Math.max(0, Math.min(100, goal.progressPercent + delta));
    setUpdating(true);
    try {
      await apiMutate(`/api/performance/goals/${goal.id}`, 'PATCH', { progressPercent: next });
      onChanged();
    } finally {
      setUpdating(false);
    }
  };

  const markComplete = async () => {
    setUpdating(true);
    try {
      await apiMutate(`/api/performance/goals/${goal.id}`, 'PATCH', { status: 'COMPLETED' });
      onChanged();
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete goal "${goal.title}"? This cannot be undone.`)) return;
    setUpdating(true);
    try {
      await apiMutate(`/api/performance/goals/${goal.id}`, 'DELETE');
      onChanged();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{goal.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
              {goal.isOverdue && goal.status === 'ACTIVE' ? 'OVERDUE' : goal.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {CATEGORY_LABEL[goal.category]}
            </span>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtDate(goal.dueDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit goal"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={updating}
            aria-label="Delete goal"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showEmployee && (
        <EmployeeChip
          employeeId={goal.employee.id}
          name={`${goal.employee.firstName} ${goal.employee.lastName}`}
          sublabel={goal.employee.jobTitle}
          size="sm"
        />
      )}

      {goal.description && (
        <p className="text-[12px] text-slate-500 leading-relaxed">{goal.description}</p>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
          <span className="text-[13px] font-bold text-slate-900">{goal.progressPercent}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              goal.status === 'COMPLETED' ? 'bg-emerald-500'
              : goal.isOverdue ? 'bg-rose-500'
              : 'bg-indigo-500'
            }`}
            ref={(el) => { if (el) el.style.width = `${goal.progressPercent}%`; }}
          />
        </div>
      </div>

      {/* Quick-adjust */}
      {goal.status === 'ACTIVE' && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => adjustProgress(-10)}
            disabled={updating || goal.progressPercent === 0}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
          >
            −10%
          </button>
          <button
            type="button"
            onClick={() => adjustProgress(10)}
            disabled={updating || goal.progressPercent === 100}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
          >
            +10%
          </button>
          <button
            type="button"
            onClick={markComplete}
            disabled={updating}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            <CheckCircle2 className="w-3 h-3" />
            Mark Complete
          </button>
        </div>
      )}

      {goal.notes && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Notes</div>
          <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">{goal.notes}</p>
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
        active ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Goal form modal (create + edit) ─────────────────────────────────────────

function GoalFormModal({
  isOpen, onClose, onSaved, existing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: Goal;
}) {
  const editing = !!existing;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'INDIVIDUAL' | 'TEAM' | 'ORGANIZATIONAL'>('INDIVIDUAL');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(existing?.title ?? '');
    setDescription(existing?.description ?? '');
    setCategory(existing?.category ?? 'INDIVIDUAL');
    setDueDate(existing?.dueDate ? existing.dueDate.slice(0, 10) : '');
    setStatus((existing?.status as any) ?? 'ACTIVE');
    setProgress(existing?.progressPercent ?? 0);
    setNotes(existing?.notes ?? '');
    setError(null);
  }, [isOpen, existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title,
        description: description || null,
        category,
        dueDate: dueDate || null,
        status,
        progressPercent: progress,
        notes: notes || null,
      };
      if (editing) {
        await apiMutate(`/api/performance/goals/${existing!.id}`, 'PATCH', payload);
      } else {
        await apiMutate('/api/performance/goals', 'POST', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save goal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Goal' : 'New Goal'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ship the leave admin redesign by Q3"
            aria-label="Title"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does success look like? Be specific so HR can support you."
            aria-label="Description"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              aria-label="Category"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="TEAM">Team</option>
              <option value="ORGANIZATIONAL">Organizational</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Due date"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                aria-label="Status"
                className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress: {progress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                aria-label="Progress"
                className="w-full h-[44px]"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Running notes / updates / blockers"
            aria-label="Notes"
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
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
