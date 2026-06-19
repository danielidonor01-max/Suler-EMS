'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  LogIn, LogOut, Activity, MapPin,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

interface AttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function lagosTodayISO(): string {
  // Same convention as the server — Lagos calendar day expressed as
  // UTC-midnight ISO date string. Used as the key for "today's row".
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return `${lagos.getUTCFullYear()}-${String(lagos.getUTCMonth() + 1).padStart(2, '0')}-${String(lagos.getUTCDate()).padStart(2, '0')}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}

function formatHours(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return '—';
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const hrs = ms / (1000 * 60 * 60);
  return `${hrs.toFixed(1)} h`;
}

export default function MyAttendancePage() {
  const [cursor, setCursor] = useState(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  });

  const monthStart = useMemo(
    () => new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)),
    [cursor],
  );
  const monthEnd = useMemo(
    () => new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)),
    [cursor],
  );

  const { data: records = [], refresh } = useApi<AttendanceRow[]>(
    `/api/attendance/me?from=${toISODate(monthStart)}&to=${toISODate(monthEnd)}`,
    { pollMs: 60_000 },
  );

  const byDate = useMemo(() => {
    const m = new Map<string, AttendanceRow>();
    records.forEach(r => {
      const key = r.date.slice(0, 10); // YYYY-MM-DD from ISO
      m.set(key, r);
    });
    return m;
  }, [records]);

  const todayISO = lagosTodayISO();
  const todayRow = byDate.get(todayISO) ?? null;
  const clockedIn = !!todayRow?.checkIn && !todayRow?.checkOut;
  const clockedOut = !!todayRow?.checkOut;

  const [busy, setBusy] = useState<'in' | 'out' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(Date.now());

  // Geo-fence override flow: when the server returns OUT_OF_BOUNDS, we
  // surface an inline form asking for a reason and retry the punch with
  // that note attached.
  const [overridePrompt, setOverridePrompt] = useState<{
    action: 'in' | 'out';
    lat: number;
    lng: number;
    message: string;
  } | null>(null);
  const [overrideNote, setOverrideNote] = useState('');

  // Live clock so the header time updates without manual refresh.
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Wraps getCurrentPosition in a promise with a sensible timeout. We
  // request high-accuracy because office radii are often 100-200 m and
  // wifi-fallback positioning regularly misses by that much.
  const requestPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available in this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 30_000,
      });
    });

  const handleClock = async (
    action: 'in' | 'out',
    overrides?: { lat: number; lng: number; note: string },
  ) => {
    setBusy(action);
    setError(null);
    try {
      let lat: number, lng: number, note: string | null;
      if (overrides) {
        lat = overrides.lat;
        lng = overrides.lng;
        note = overrides.note;
      } else {
        const pos = await requestPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        note = null;
      }

      try {
        await apiMutate(`/api/attendance/clock-${action}`, 'POST', { lat, lng, note });
        await refresh();
        setOverridePrompt(null);
        setOverrideNote('');
      } catch (err: any) {
        // OUT_OF_BOUNDS: the server is asking for a justification. Show
        // the inline override form rather than just surfacing an error.
        const msg = err?.message ?? '';
        if (msg.includes('You are') && msg.includes('m from')) {
          setOverridePrompt({ action, lat, lng, message: msg });
          return;
        }
        throw err;
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Action failed';
      // Friendlier text for the common case of denied browser permission.
      if (msg.includes('User denied') || msg.includes('denied geolocation')) {
        setError('Location permission denied. Allow location in your browser to clock in.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(null);
    }
  };

  // Stats — derived once per month load.
  const stats = useMemo(() => {
    let present = 0, late = 0, totalHours = 0;
    for (const r of records) {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'LATE') late++;
      if (r.checkIn && r.checkOut) {
        totalHours += (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60);
      }
    }
    return { present, late, totalHours };
  }, [records]);

  // Calendar grid spans Monday-of-week-containing-day-1 through
  // Sunday-of-week-containing-last-day so we always render full weeks.
  const startDow = (monthStart.getUTCDay() + 6) % 7; // Mon = 0
  const fromDate = new Date(monthStart);
  fromDate.setUTCDate(monthStart.getUTCDate() - startDow);
  const endDow = (monthEnd.getUTCDay() + 6) % 7;
  const toDate = new Date(monthEnd);
  toDate.setUTCDate(monthEnd.getUTCDate() + (6 - endDow));

  const weeks: Date[][] = [];
  {
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      weeks.push(week);
    }
  }

  const prevMonth = () => setCursor(c => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1)));
  const nextMonth = () => setCursor(c => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1)));
  const goToday   = () => {
    const t = new Date();
    setCursor(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-slate-500 text-[14px] mt-2">
            Clock in when you start, clock out when you wrap. Late after 09:00 WAT.
          </p>
        </div>

        {/* ── Today + Clock action ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-6 bg-white border border-slate-200 rounded-[20px] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {new Intl.DateTimeFormat('en-NG', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                    timeZone: 'Africa/Lagos',
                  }).format(new Date(tick))}
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  {new Intl.DateTimeFormat('en-NG', {
                    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
                  }).format(new Date(tick))} WAT
                </p>
              </div>
              <TodayStatusBadge row={todayRow} />
            </div>

            {/* Clock-in / Clock-out action */}
            <div className="grid grid-cols-2 gap-3">
              <ClockButton
                action="in"
                disabled={!!todayRow?.checkIn || busy !== null}
                busy={busy === 'in'}
                onClick={() => handleClock('in')}
                time={todayRow?.checkIn}
              />
              <ClockButton
                action="out"
                disabled={!todayRow?.checkIn || !!todayRow?.checkOut || busy !== null}
                busy={busy === 'out'}
                onClick={() => handleClock('out')}
                time={todayRow?.checkOut}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-[12px] font-medium text-rose-700">{error}</span>
              </div>
            )}

            {overridePrompt && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-amber-800">{overridePrompt.message}</p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Add a brief reason — your manager will see this on the attendance audit.
                    </p>
                  </div>
                </div>
                <input
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Field visit at customer site, working from home"
                  aria-label="Override reason"
                  className="w-full h-10 bg-white border border-amber-200 rounded-lg px-3 text-[12px] outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setOverridePrompt(null); setOverrideNote(''); }}
                    disabled={busy !== null}
                    className="flex-1 h-9 bg-white border border-amber-200 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClock(overridePrompt.action, {
                      lat:  overridePrompt.lat,
                      lng:  overridePrompt.lng,
                      note: overrideNote.trim(),
                    })}
                    disabled={!overrideNote.trim() || busy !== null}
                    className="flex-1 h-9 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
                  >
                    {busy ? 'Submitting…' : `Confirm Clock ${overridePrompt.action}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Month stats ───────────────────────────────────────────── */}
          <div className="p-6 bg-white border border-slate-200 rounded-[20px] space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {MONTH_NAMES[cursor.getUTCMonth()]} {cursor.getUTCFullYear()}
            </p>
            <StatRow icon={CheckCircle2} label="Present" value={stats.present} tone="emerald" />
            <StatRow icon={Clock}        label="Late"    value={stats.late}    tone="amber"   />
            <StatRow icon={Activity}     label="Hours"   value={`${stats.totalHours.toFixed(1)} h`} tone="slate" />
          </div>
        </div>

        {/* ── Month grid ────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {MONTH_NAMES[cursor.getUTCMonth()]} {cursor.getUTCFullYear()}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Attendance Calendar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="px-3 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">{d}</div>
            ))}
            {weeks.flat().map((day, idx) => {
              const key = toISODate(day);
              const row = byDate.get(key);
              const inMonth = day.getUTCMonth() === cursor.getUTCMonth();
              const isToday = key === todayISO;
              const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
              const tone =
                row?.status === 'PRESENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : row?.status === 'LATE'  ? 'bg-amber-50 border-amber-200 text-amber-700'
                : row?.status === 'ABSENT' ? 'bg-rose-50 border-rose-200 text-rose-700'
                : isWeekend ? 'bg-slate-50/60 border-slate-100 text-slate-400'
                : 'bg-white border-slate-100 text-slate-500';
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] rounded-xl p-2 border transition-all ${tone} ${
                    !inMonth ? 'opacity-40' : ''
                  } ${isToday ? 'ring-2 ring-indigo-300' : ''}`}
                >
                  <div className="text-[11px] font-black">{day.getUTCDate()}</div>
                  {row && (
                    <div className="mt-2 space-y-0.5">
                      <div className="text-[9px] font-bold uppercase tracking-widest">{row.status}</div>
                      {row.checkIn && (
                        <div className="text-[9px]">
                          {formatTime(row.checkIn)}{row.checkOut ? ` – ${formatTime(row.checkOut)}` : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
            <LegendDot tone="bg-emerald-500" label="Present" />
            <LegendDot tone="bg-amber-500"   label="Late" />
            <LegendDot tone="bg-rose-500"    label="Absent" />
            <LegendDot tone="bg-slate-300"   label="Weekend / Not recorded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Atoms ──────────────────────────────────────────────────────────────────

function ClockButton({
  action, disabled, busy, onClick, time,
}: {
  action: 'in' | 'out';
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
  time: string | null | undefined;
}) {
  const Icon = action === 'in' ? LogIn : LogOut;
  const palette =
    action === 'in'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
      : 'bg-slate-900 hover:bg-black text-white border-slate-900';
  const label = action === 'in' ? 'Clock In' : 'Clock Out';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center h-[80px] rounded-2xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${palette}`}
    >
      <Icon className="w-5 h-5 mb-1" />
      <div className="text-[12px] font-bold uppercase tracking-widest">
        {busy ? 'Working…' : label}
      </div>
      {time && (
        <div className="text-[10px] mt-0.5 opacity-80">@ {formatTime(time)}</div>
      )}
    </button>
  );
}

function TodayStatusBadge({ row }: { row: AttendanceRow | null }) {
  if (!row) {
    return (
      <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        Not Started
      </span>
    );
  }
  if (row.checkOut) {
    return (
      <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-widest">
        Wrapped — {row.status}
      </span>
    );
  }
  const tone =
    row.status === 'LATE'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return (
    <span className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-widest ${tone}`}>
      Clocked In · {row.status}
    </span>
  );
}

function StatRow({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: 'emerald' | 'amber' | 'slate';
}) {
  const palette =
    tone === 'emerald' ? { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
    : tone === 'amber'   ? { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' }
    : { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl border ${palette.bg} ${palette.border} ${palette.text} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${tone}`} />
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
