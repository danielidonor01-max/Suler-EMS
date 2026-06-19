"use client";

import React, { useMemo, useState } from 'react';
import {
  Calendar, MapPin, AlertTriangle, CheckCircle2, Clock,
  Edit3, Filter,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { Modal } from '@/components/common/Modal';

interface AdminRow {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  checkInLat: number | null;
  checkInLng: number | null;
  checkInDistance: number | null;
  checkInNote: string | null;
  checkOutDistance: number | null;
  checkOutNote: string | null;
  checkInSite:  { id: string; name: string } | null;
  checkOutSite: { id: string; name: string } | null;
  employee: {
    id: string; staffId: string; firstName: string; lastName: string;
    jobTitle: string;
    department: { id: string; name: string } | null;
  } | null;
}

interface WorkSite { id: string; name: string }

const STATUS_TONE: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  LATE:    'bg-amber-50  text-amber-700  border-amber-100',
  ABSENT:  'bg-rose-50   text-rose-700   border-rose-100',
};

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function lagosToday(): string {
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return toISODate(new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate())));
}
function lagosDaysAgo(n: number): string {
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  const d = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() - n));
  return toISODate(d);
}
function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}
function fmtDistance(m: number | null): string {
  if (m == null) return '—';
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function AttendanceAdminPage() {
  const { userRole, checkPermission } = useAccess();
  const canView = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN'
    || checkPermission('attendance:view' as any).allowed;
  const canEdit = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [from, setFrom] = useState(lagosDaysAgo(6));
  const [to,   setTo]   = useState(lagosToday());
  const [status, setStatus] = useState<'' | 'PRESENT' | 'LATE' | 'ABSENT'>('');
  const [siteId, setSiteId] = useState<string>('');
  const [offSiteOnly, setOffSiteOnly] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams({ from, to });
    if (status)      sp.set('status', status);
    if (siteId)      sp.set('siteId', siteId);
    if (offSiteOnly) sp.set('offSiteOnly', 'true');
    return sp.toString();
  }, [from, to, status, siteId, offSiteOnly]);

  const { data: rows = [], refresh } = useApi<AdminRow[]>(
    canView ? `/api/attendance/admin?${queryString}` : null,
    { pollMs: 60_000 },
  );
  const { data: sites = [] } = useApi<WorkSite[]>(canView ? '/api/work-sites' : null);

  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0, offSite = 0;
    for (const r of rows) {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'ABSENT') absent++;
      if (r.checkInNote || r.checkOutNote) offSite++;
    }
    return { present, late, absent, offSite };
  }, [rows]);

  if (!canView) {
    return (
      <div className="section-breathing max-w-[900px] mx-auto p-8">
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Not authorized</h3>
          <p className="text-[13px] text-slate-500">attendance:view permission required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Attendance
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
          Attendance Review
        </h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[600px]">
          Every punch with its geo-fence resolution. Off-site rows carry an operator-supplied reason that surfaces here for review.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Present"  value={`${stats.present}`} icon={CheckCircle2} variant="tonal-success" />
        <MetricCard label="Late"     value={`${stats.late}`}    icon={Clock}        variant="tonal-warning" />
        <MetricCard label="Absent"   value={`${stats.absent}`}  icon={AlertTriangle} variant={stats.absent > 0 ? 'tonal-warning' : 'tonal-info'} />
        <MetricCard label="Off-site" value={`${stats.offSite}`} icon={MapPin}        variant={stats.offSite > 0 ? 'tonal-warning' : 'tonal-info'} />
      </div>

      <div className="bg-white rounded-[20px] border border-slate-200 p-5 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 mr-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filters</span>
        </div>
        <FilterInput label="From">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From"
            className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:border-indigo-500" />
        </FilterInput>
        <FilterInput label="To">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To"
            className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:border-indigo-500" />
        </FilterInput>
        <FilterInput label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} aria-label="Status"
            className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:border-indigo-500">
            <option value="">All</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
        </FilterInput>
        <FilterInput label="Site">
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} aria-label="Site"
            className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:border-indigo-500">
            <option value="">Any</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FilterInput>
        <label className="flex items-center gap-2 h-10 text-[12px] text-slate-700 cursor-pointer">
          <input type="checkbox" checked={offSiteOnly} onChange={(e) => setOffSiteOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-indigo-600" />
          Off-site only
        </label>
        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rows.length} rows</span>
      </div>

      <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">In</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Location</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Out</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Out Location</th>
                {canEdit && <th scope="col" className="w-12"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-4 py-12 text-center text-[13px] text-slate-500">
                    No attendance rows in this window.
                  </td>
                </tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-bold text-slate-700">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2">
                    {r.employee ? (
                      <EmployeeChip
                        employeeId={r.employee.id}
                        name={`${r.employee.firstName} ${r.employee.lastName}`}
                        sublabel={`${r.employee.staffId}${r.employee.department ? ` · ${r.employee.department.name}` : ''}`}
                        size="sm"
                      />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-900">{fmtTime(r.checkIn)}</td>
                  <td className="px-4 py-2"><LocationCell site={r.checkInSite} distance={r.checkInDistance} note={r.checkInNote} /></td>
                  <td className="px-4 py-2 font-mono text-slate-900">{fmtTime(r.checkOut)}</td>
                  <td className="px-4 py-2"><LocationCell site={r.checkOutSite} distance={r.checkOutDistance} note={r.checkOutNote} /></td>
                  {canEdit && (
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label="Edit attendance record"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditRecordModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
      />
    </div>
  );
}

function LocationCell({
  site, distance, note,
}: {
  site:     { id: string; name: string } | null;
  distance: number | null;
  note:     string | null;
}) {
  if (site) {
    return (
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
        <span className="font-bold text-slate-900 truncate">{site.name}</span>
        {distance !== null && <span className="text-[10px] text-slate-400">({fmtDistance(distance)})</span>}
      </div>
    );
  }
  if (note) {
    return (
      <div className="flex items-start gap-1.5">
        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-amber-700 text-[10px] uppercase tracking-widest">Off-site</div>
          <div className="text-[11px] text-slate-700 truncate" title={note}>{note}</div>
          {distance !== null && <div className="text-[10px] text-slate-400">{fmtDistance(distance)} from nearest</div>}
        </div>
      </div>
    );
  }
  return <span className="text-slate-400">—</span>;
}

function FilterInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      {children}
    </div>
  );
}

function EditRecordModal({
  row, onClose, onSaved,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toLocalInput = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [checkIn,       setCheckIn]       = useState('');
  const [checkOut,      setCheckOut]      = useState('');
  const [status,        setStatus]        = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [checkInNote,   setCheckInNote]   = useState('');
  const [checkOutNote,  setCheckOutNote]  = useState('');
  const [busy,          setBusy]          = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  React.useEffect(() => {
    if (!row) return;
    setCheckIn(toLocalInput(row.checkIn));
    setCheckOut(toLocalInput(row.checkOut));
    setStatus(row.status);
    setCheckInNote(row.checkInNote ?? '');
    setCheckOutNote(row.checkOutNote ?? '');
    setError(null);
  }, [row]);

  if (!row) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        status,
        checkInNote:  checkInNote || null,
        checkOutNote: checkOutNote || null,
      };
      // Only send time fields when they've been entered, so an empty box
      // doesn't accidentally null an existing time.
      if (checkIn)  payload.checkIn  = new Date(checkIn).toISOString();
      if (checkOut) payload.checkOut = new Date(checkOut).toISOString();
      else if (row.checkOut && !checkOut) payload.checkOut = null;

      await apiMutate(`/api/attendance/admin/${row.id}`, 'PATCH', payload);
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const employeeName = row.employee
    ? `${row.employee.firstName} ${row.employee.lastName}`
    : '(unknown)';

  return (
    <Modal isOpen={!!row} onClose={onClose} title="Correct Attendance" subtitle={`${employeeName} · ${fmtDate(row.date)}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check In">
            <input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
              aria-label="Check in"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500" />
          </Field>
          <Field label="Check Out">
            <input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
              aria-label="Check out"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500" />
          </Field>
        </div>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} aria-label="Status"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500">
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
        </Field>
        <Field label="Check-In Note">
          <textarea value={checkInNote} onChange={(e) => setCheckInNote(e.target.value)} rows={2}
            placeholder="Off-site reason, manager comment…"
            aria-label="Check-in note"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500" />
        </Field>
        <Field label="Check-Out Note">
          <textarea value={checkOutNote} onChange={(e) => setCheckOutNote(e.target.value)} rows={2}
            placeholder="Off-site reason, manager comment…"
            aria-label="Check-out note"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500" />
        </Field>

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
            {busy ? 'Saving…' : 'Save Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
