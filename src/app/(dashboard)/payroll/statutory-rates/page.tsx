"use client";

import React, { useEffect, useState } from 'react';
import { Scale, Save, Plus, Trash2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';

interface PAYEBand {
  width: number;
  rate:  number;
}

interface RateRow {
  code:        string;
  name:        string;
  type:        'BAND' | 'PERCENTAGE' | 'FIXED';
  description: string;
  row: {
    id:            string;
    value:         { value?: number; bands?: PAYEBand[] };
    effectiveFrom: string;
    updatedAt:     string;
    notes:        string | null;
  } | undefined;
}

const SAFE_LARGE = Number.MAX_SAFE_INTEGER;

function unwrapValue(rate: RateRow): number | PAYEBand[] {
  if (rate.type === 'BAND') {
    return (rate.row?.value?.bands as PAYEBand[]) ?? [];
  }
  return (rate.row?.value?.value as number) ?? 0;
}

function fmtNGN(n: number): string {
  return n.toLocaleString('en-NG');
}

export default function StatutoryRatesPage() {
  const { userRole, checkPermission } = useAccess();
  const canManage = userRole === 'SUPER_ADMIN'
    || userRole === 'HR_ADMIN'
    || checkPermission('settings:manage' as any).allowed
    || checkPermission('payroll:edit' as any).allowed;

  const { data: rows = [], refresh } = useApi<RateRow[]>(
    canManage ? '/api/payroll/statutory-rates' : null,
  );

  const [pct,   setPct]   = useState<Record<string, number>>({});
  const [bands, setBands] = useState<PAYEBand[]>([]);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [broadcast, setBroadcast] = useState<number | null>(null);

  // Hydrate local state from server values whenever rows refresh.
  useEffect(() => {
    if (rows.length === 0) return;
    const nextPct: Record<string, number> = {};
    for (const r of rows) {
      if (r.type === 'BAND') {
        setBands((unwrapValue(r) as PAYEBand[]) ?? []);
      } else {
        nextPct[r.code] = unwrapValue(r) as number;
      }
    }
    setPct(nextPct);
  }, [rows]);

  if (!canManage) {
    return (
      <div className="section-breathing max-w-[1200px] mx-auto p-8">
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Not authorized</h3>
          <p className="text-[13px] text-slate-500">Statutory rate management requires settings:manage or payroll:edit.</p>
        </div>
      </div>
    );
  }

  const setBand = (i: number, field: 'width' | 'rate', value: number) => {
    setBands(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  };
  const addBand = () => {
    setBands(prev => [...prev, { width: 100_000, rate: 0.10 }]);
  };
  const removeBand = (i: number) => {
    setBands(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updates: Array<{ code: string; value: number | PAYEBand[] }> = [];

      // Percentage / fixed rates
      for (const r of rows) {
        if (r.type === 'BAND') continue;
        const current = pct[r.code];
        if (current == null) continue;
        updates.push({ code: r.code, value: current });
      }

      // PAYE bands — replace the sentinel width on the last row with
      // MAX_SAFE_INTEGER so it remains the "and above" catch-all even
      // if the admin entered something small.
      if (bands.length > 0) {
        const sealed = bands.map((b, i) =>
          i === bands.length - 1 ? { ...b, width: SAFE_LARGE } : b
        );
        updates.push({ code: 'PAYE_BANDS_MONTHLY', value: sealed });
      }

      const result = await apiMutate<{ broadcastCount?: number } | unknown>(
        '/api/payroll/statutory-rates', 'PATCH', { updates },
      );
      const count = (result as { broadcastCount?: number } | null)?.broadcastCount ?? 0;
      setBroadcast(count);
      setSaved(true);
      await refresh();
      setTimeout(() => { setSaved(false); setBroadcast(null); }, 5000);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save rates');
    } finally {
      setBusy(false);
    }
  };

  const percentRows = rows.filter(r => r.type === 'PERCENTAGE');
  const fixedRows   = rows.filter(r => r.type === 'FIXED');
  const bandRow     = rows.find(r => r.type === 'BAND');

  return (
    <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Scale className="w-3 h-3" />
                Statutory Rates
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Tax &amp; Statutory Configuration
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[600px]">
              These rates drive every payroll run going forward. Already-processed runs are unaffected — each one snapshotted the rates in force at the time.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {busy ? 'Committing…' : 'Global Commit'}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          A Global Commit fans out a notification to every active user announcing the new statutory policy and what changed.
        </p>

        {saved && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[12px] font-bold text-emerald-700 leading-relaxed">
              Policy committed. Applies to all payroll runs from now on.
              {broadcast != null && broadcast > 0 && (
                <span className="font-medium block mt-0.5 text-emerald-600">
                  Notification broadcast to {broadcast} active user{broadcast === 1 ? '' : 's'}.
                </span>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}
      </div>

      {/* Percentage rates */}
      <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Contribution Rates</h2>
          <p className="text-[12px] text-slate-500 mt-1">Pension, NHF, NHIS, and Consolidated Relief Allowance percentages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {percentRows.map(r => (
            <div key={r.code} className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.name}</label>
              <div className="relative">
                <input
                  type="number" step="0.01" min={0} max={100}
                  value={(pct[r.code] ?? 0) * 100}
                  onChange={(e) => setPct(p => ({ ...p, [r.code]: parseFloat(e.target.value) / 100 }))}
                  aria-label={r.name}
                  className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 text-[13px] font-bold outline-none focus:border-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{r.description}</p>
            </div>
          ))}

          {fixedRows.map(r => (
            <div key={r.code} className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.name}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">₦</span>
                <input
                  type="number" step="1" min={0}
                  value={pct[r.code] ?? 0}
                  onChange={(e) => setPct(p => ({ ...p, [r.code]: parseFloat(e.target.value) }))}
                  aria-label={r.name}
                  className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 text-[13px] font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PAYE bands */}
      {bandRow && (
        <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">PAYE Bands — Monthly</h2>
              <p className="text-[12px] text-slate-500 mt-1">
                Progressive bands. Each &ldquo;width&rdquo; is the additional NGN above the previous band. The final band&apos;s width is ignored — it absorbs all remaining income.
              </p>
            </div>
            <button
              type="button"
              onClick={addBand}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" />
              Add Band
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-20">#</th>
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Band Width (NGN)</th>
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate (%)</th>
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cumulative Through</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bands.map((b, i) => {
                  const isLast = i === bands.length - 1;
                  const cumulative = bands.slice(0, i + 1).reduce((s, x, idx) => s + (idx === bands.length - 1 ? 0 : x.width), 0);
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500 font-bold text-[11px]">{i + 1}</td>
                      <td className="px-4 py-2">
                        {isLast ? (
                          <span className="text-slate-400 italic text-[12px]">(and above)</span>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">₦</span>
                            <input
                              type="number" step="1" min={1}
                              value={b.width}
                              onChange={(e) => setBand(i, 'width', parseFloat(e.target.value))}
                              aria-label={`Band ${i + 1} width`}
                              className="w-40 h-[36px] bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 text-[12px] font-bold outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative w-28">
                          <input
                            type="number" step="0.01" min={0} max={100}
                            value={b.rate * 100}
                            onChange={(e) => setBand(i, 'rate', parseFloat(e.target.value) / 100)}
                            aria-label={`Band ${i + 1} rate`}
                            className="w-full h-[36px] bg-slate-50 border border-slate-200 rounded-lg px-2 pr-7 text-[12px] font-bold outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-[12px]">
                        {isLast ? '∞' : `₦${fmtNGN(cumulative)}`}
                      </td>
                      <td className="px-4 py-2">
                        {bands.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBand(i)}
                            aria-label={`Remove band ${i + 1}`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-indigo-700 leading-relaxed">
              These are <strong>monthly</strong> bands applied to monthly taxable income (gross less CRA, pension, and NHF). Use the cumulative-through column to sanity-check the breakpoints.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
