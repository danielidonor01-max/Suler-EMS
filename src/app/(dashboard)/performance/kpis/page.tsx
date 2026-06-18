"use client";

import React, { useMemo, useState } from 'react';
import {
  TrendingUp, Plus, Target, AlertTriangle, CheckCircle2, Edit3,
  Trash2, Users, ChartBar, Activity,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { Modal } from '@/components/common/Modal';

interface Measurement {
  id: string;
  periodStart: string;
  periodEnd: string;
  actualValue: number;
  notes: string | null;
  recordedBy: { id: string; name: string };
}

interface KPI {
  id: string;
  title: string;
  description: string | null;
  target: number;
  unit: string | null;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string };
  owner: { id: string; name: string; email: string };
  measurements: Measurement[];
}

const FREQ_LABEL: Record<string, string> = {
  WEEKLY:    'Weekly',
  MONTHLY:   'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL:    'Annual',
};

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  ACTIVE:   { text: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  PAUSED:   { text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  ARCHIVED: { text: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200' },
};

function fmtNumber(n: number, unit: string | null): string {
  if (Math.abs(n) >= 1000) return `${n.toLocaleString('en-NG')}${unit ? ` ${unit}` : ''}`;
  return `${n}${unit ? ` ${unit}` : ''}`;
}

function progressPct(latest: number | null, target: number): number {
  if (latest == null || target === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((latest / target) * 100)));
}

export default function KPIsPage() {
  const { userRole } = useAccess();
  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<KPI | null>(null);
  const [recording, setRecording] = useState<KPI | null>(null);

  const { data: kpis = [], refresh } = useApi<KPI[]>(
    `/api/performance/kpis?scope=${tab}`,
    { pollMs: 30_000 },
  );

  const stats = useMemo(() => {
    let active = 0, paused = 0, hittingTarget = 0;
    for (const k of kpis) {
      if (k.status === 'ACTIVE') active++;
      if (k.status === 'PAUSED') paused++;
      const latest = k.measurements[0]?.actualValue ?? null;
      if (k.status === 'ACTIVE' && latest !== null && latest >= k.target) hittingTarget++;
    }
    return { active, paused, hittingTarget };
  }, [kpis]);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                KPIs
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Key Performance Indicators
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[540px]">
              Define measurable metrics, log actuals per period, watch the trend. Goals and reviews answer &ldquo;am I getting better?&rdquo;
              — KPIs answer &ldquo;by how much, this period?&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            New KPI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Active"          value={`${stats.active}`}        variant="tonal-info"    icon={Target} />
        <MetricCard label="Paused"          value={`${stats.paused}`}        variant="tonal-warning" icon={Activity} />
        <MetricCard label="Hitting Target"  value={`${stats.hittingTarget}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Total Metrics"   value={`${kpis.length}`}         variant="tonal-info"    icon={ChartBar} />
      </div>

      {isHR && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
          <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')} icon={Target} label="My KPIs" />
          <TabBtn active={tab === 'all'}  onClick={() => setTab('all')}  icon={Users}  label="All Employees" />
        </div>
      )}

      {kpis.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No KPIs yet</h3>
          <p className="text-[13px] text-slate-500 max-w-[400px] mx-auto">
            Define a metric you want to track — sales calls / month, page-load latency, customer NPS — set a target, and start logging actuals.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First KPI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {kpis.map(k => (
            <KPICard
              key={k.id}
              kpi={k}
              showEmployee={tab === 'all'}
              onEdit={() => setEditing(k)}
              onRecord={() => setRecording(k)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <KPIFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); refresh(); }}
      />
      <KPIFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
        existing={editing ?? undefined}
      />
      <RecordMeasurementModal
        kpi={recording}
        onClose={() => setRecording(null)}
        onRecorded={() => { setRecording(null); refresh(); }}
      />

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

function KPICard({
  kpi, showEmployee, onEdit, onRecord, onChanged,
}: {
  kpi: KPI;
  showEmployee: boolean;
  onEdit: () => void;
  onRecord: () => void;
  onChanged: () => void;
}) {
  const tone = STATUS_TONE[kpi.status] ?? STATUS_TONE.ACTIVE;
  const latest = kpi.measurements[0]?.actualValue ?? null;
  const pct = progressPct(latest, kpi.target);

  // Build sparkline data — most recent first in measurements; reverse to
  // plot chronologically. Max 12 points (matches the API select).
  const sparkData = [...kpi.measurements].reverse();
  const sparkMax = Math.max(kpi.target, ...sparkData.map(m => m.actualValue), 1);

  const handleDelete = async () => {
    if (!confirm(`Delete KPI "${kpi.title}"? All measurements will also be removed.`)) return;
    try {
      await apiMutate(`/api/performance/kpis/${kpi.id}`, 'DELETE');
      onChanged();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{kpi.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
              {kpi.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{FREQ_LABEL[kpi.frequency]}</span>
            <span className="text-[10px] font-bold text-slate-400">
              Target {fmtNumber(kpi.target, kpi.unit)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit KPI"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete KPI"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showEmployee && (
        <EmployeeChip
          employeeId={kpi.employee.id}
          name={`${kpi.employee.firstName} ${kpi.employee.lastName}`}
          sublabel={kpi.employee.jobTitle}
          size="sm"
        />
      )}

      {kpi.description && (
        <p className="text-[12px] text-slate-500 leading-relaxed">{kpi.description}</p>
      )}

      {/* Latest value + progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest</span>
          <span className="text-[13px] font-bold text-slate-900">
            {latest !== null ? fmtNumber(latest, kpi.unit) : 'No data'}
            {latest !== null && <span className="text-slate-400 text-[11px] ml-2">({pct}% of target)</span>}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-indigo-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            ref={(el) => { if (el) el.style.width = `${pct}%`; }}
          />
        </div>
      </div>

      {/* Sparkline of recent measurements */}
      {sparkData.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend ({sparkData.length} period{sparkData.length === 1 ? '' : 's'})</span>
          <div className="flex items-end gap-1 h-12">
            {sparkData.map((m, i) => {
              const h = Math.max(4, (m.actualValue / sparkMax) * 100);
              const hit = m.actualValue >= kpi.target;
              return (
                <div
                  key={m.id}
                  title={`${fmtNumber(m.actualValue, kpi.unit)} — ${new Date(m.periodStart).toLocaleDateString()}`}
                  className={`flex-1 rounded-t ${hit ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                  ref={(el) => { if (el) el.style.height = `${h}%`; }}
                  style={{ minHeight: '4px' }}
                />
              );
            })}
            {Array.from({ length: Math.max(0, 12 - sparkData.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 rounded-t bg-slate-100 h-1" />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onRecord}
          disabled={kpi.status === 'ARCHIVED'}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          <Plus className="w-3 h-3" />
          Record Period
        </button>
      </div>
    </div>
  );
}

function KPIFormModal({
  isOpen, onClose, onSaved, existing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: KPI;
}) {
  const editing = !!existing;
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget]           = useState<number>(0);
  const [unit, setUnit]               = useState('');
  const [frequency, setFrequency]     = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [status, setStatus]           = useState<'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ACTIVE');
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(existing?.title ?? '');
    setDescription(existing?.description ?? '');
    setTarget(existing?.target ?? 0);
    setUnit(existing?.unit ?? '');
    setFrequency(existing?.frequency ?? 'MONTHLY');
    setStatus(existing?.status ?? 'ACTIVE');
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
        target,
        unit: unit || null,
        frequency,
        status,
      };
      if (editing) {
        await apiMutate(`/api/performance/kpis/${existing!.id}`, 'PATCH', payload);
      } else {
        await apiMutate('/api/performance/kpis', 'POST', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save KPI');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit KPI' : 'New KPI'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metric Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tickets resolved per week"
            aria-label="Title"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Define the metric. What counts? What doesn't?"
            aria-label="Description"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</label>
            <input
              required type="number" step="any"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              aria-label="Target"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="calls, %, ₦, hrs"
              aria-label="Unit"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              aria-label="Frequency"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        </div>
        {editing && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              aria-label="Status"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        )}
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
          <button type="submit" disabled={busy || !title.trim()}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create KPI'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RecordMeasurementModal({
  kpi, onClose, onRecorded,
}: {
  kpi: KPI | null;
  onClose: () => void;
  onRecorded: () => void;
}) {
  // Default period bounds — current month start to month end.
  const monthBoundsToday = (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  })();

  const [periodStart, setPeriodStart] = useState(monthBoundsToday.start);
  const [periodEnd, setPeriodEnd]     = useState(monthBoundsToday.end);
  const [actualValue, setActualValue] = useState<number>(0);
  const [notes, setNotes]             = useState('');
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);

  React.useEffect(() => {
    if (!kpi) return;
    setPeriodStart(monthBoundsToday.start);
    setPeriodEnd(monthBoundsToday.end);
    setActualValue(0);
    setNotes('');
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpi]);

  if (!kpi) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/performance/kpis/${kpi.id}/measurements`, 'POST', {
        periodStart,
        periodEnd,
        actualValue,
        notes: notes || null,
      });
      onRecorded();
    } catch (err: any) {
      setError(err?.message ?? 'Could not record measurement');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={!!kpi} onClose={onClose} title="Record Measurement" subtitle={kpi.title} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</div>
          <div className="text-[15px] font-bold text-slate-900">{fmtNumber(kpi.target, kpi.unit)} per {kpi.frequency.toLowerCase()}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period Start</label>
            <input
              type="date" required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              aria-label="Period start"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period End</label>
            <input
              type="date" required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              aria-label="Period end"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Actual Value{kpi.unit ? ` (${kpi.unit})` : ''}
          </label>
          <input
            required type="number" step="any"
            value={actualValue}
            onChange={(e) => setActualValue(Number(e.target.value))}
            aria-label="Actual value"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Context — anomalies, blockers, what shifted."
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
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Saving…' : 'Save Measurement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
