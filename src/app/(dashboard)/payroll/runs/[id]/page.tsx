'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Send, CheckCircle2, Banknote, ArrowLeft, History, Users, Download } from 'lucide-react';
import Link from 'next/link';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { EmployeeChip } from '@/components/employees/EmployeeChip';

interface Entry {
  id: string; employeeId: string;
  basicSalary: string | number;
  housingAllowance: string | number; transportAllowance: string | number;
  grossPay: string | number; paye: string | number;
  pensionEmployee: string | number; nhf: string | number; nhis: string | number;
  totalDeductions: string | number; netPay: string | number;
  employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle?: string; branch?: string };
}

interface AuditEntry { id: string; action: string; fromState: string; toState: string; actorName: string; actorRole: string; comment?: string | null; timestamp: string }

interface RunDetail {
  id: string; name: string; period: string; status: string;
  totalGross: string | number; totalNet: string | number;
  totalDeductions: string | number; totalEmployerContrib: string | number;
  entryCount: number;
  createdAt: string; approvedAt?: string | null; processedAt?: string | null;
  department?: { id: string; name: string; code: string } | null;
  entries?: Entry[];
  history?: AuditEntry[];
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function fmt(v: string | number) {
  return `₦${num(v).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-700',
  REVIEW:    'bg-amber-50 text-amber-700',
  APPROVED:  'bg-sky-50 text-sky-700',
  PROCESSED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function PayrollRunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { data, error, isLoading, mutate } = useSWR<RunDetail>(
    id ? `/api/payroll/runs/${id}?includeEntries=true&includeHistory=true` : null,
    apiFetcher,
    { refreshInterval: 15_000 },
  );
  const [busy, setBusy] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  async function transition(action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'PROCESS' | 'CANCEL') {
    if (!data) return;
    setBusy(true);
    setBannerError(null);
    try {
      await apiMutate(`/api/payroll/runs/${id}/transition`, 'PATCH', { action });
      await mutate();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading run…</div>;
  if (error) return <div className="p-12 text-center text-rose-700">Failed: {error.message}</div>;
  if (!data) return null;

  const canSubmit = data.status === 'DRAFT';
  const canApprove = data.status === 'REVIEW';
  const canProcess = data.status === 'APPROVED';
  const canCancel = ['DRAFT', 'APPROVED'].includes(data.status);
  // Register CSV is gated on the API side by run.status ∈ {APPROVED, PROCESSED}.
  const canDownloadRegister = ['APPROVED', 'PROCESSED'].includes(data.status);
  // Disbursement CSV (NIBSS-style) only after PROCESS — exporting earlier
  // risks Finance accidentally paying off a preview.
  const canDisburse = data.status === 'PROCESSED';

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/payroll/register" className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to runs
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{data.name}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[data.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {data.status}
              </span>
            </div>
            <p className="text-slate-500 text-[13px] mt-2">
              Period {data.period} · {data.entryCount} entries
              {data.department && ` · ${data.department.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDownloadRegister && (
              <a
                href={`/api/payroll/runs/${id}/register`}
                aria-label="Download payroll register CSV"
                className="h-[40px] px-4 rounded-[12px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Register CSV
              </a>
            )}
            {canDisburse && (
              <a
                href={`/api/payroll/runs/${id}/disbursement`}
                aria-label="Download bank disbursement CSV"
                className="h-[40px] px-4 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                <Banknote className="w-3.5 h-3.5" />
                Disbursement CSV
              </a>
            )}
            {canSubmit && (
              <button type="button" onClick={() => transition('SUBMIT_FOR_REVIEW')} disabled={busy}
                className="h-[40px] px-4 rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                <Send className="w-3.5 h-3.5" />
                Submit for Review
              </button>
            )}
            {canApprove && (
              <button type="button" onClick={() => transition('APPROVE')} disabled={busy}
                className="h-[40px] px-4 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
            )}
            {canProcess && (
              <button type="button" onClick={() => transition('PROCESS')} disabled={busy}
                className="h-[40px] px-4 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60">
                <Banknote className="w-3.5 h-3.5" />
                Process Run
              </button>
            )}
            {canCancel && (
              <button type="button" onClick={() => transition('CANCEL')} disabled={busy}
                className="h-[40px] px-4 rounded-[12px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
                Cancel
              </button>
            )}
          </div>
        </div>

        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{bannerError}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total Gross" value={fmt(data.totalGross)} />
          <Stat label="Total Deductions" value={fmt(data.totalDeductions)} />
          <Stat label="Total Net" value={fmt(data.totalNet)} tone="emerald" />
          <Stat label="Employer Pension" value={fmt(data.totalEmployerContrib)} />
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Entries ({data.entries?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Basic</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gross</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">PAYE</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Pension</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Deductions</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.entries ?? []).map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <EmployeeChip
                        employeeId={e.employee.id}
                        name={`${e.employee.firstName} ${e.employee.lastName}`}
                        sublabel={`${e.employee.staffId}${e.employee.jobTitle ? ` · ${e.employee.jobTitle}` : ''}`}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-3 text-[12px] text-slate-700">{fmt(e.basicSalary)}</td>
                    <td className="px-6 py-3 text-[12px] text-slate-700">{fmt(e.grossPay)}</td>
                    <td className="px-6 py-3 text-[12px] text-slate-700">{fmt(e.paye)}</td>
                    <td className="px-6 py-3 text-[12px] text-slate-700">{fmt(e.pensionEmployee)}</td>
                    <td className="px-6 py-3 text-[12px] text-slate-700">{fmt(e.totalDeductions)}</td>
                    <td className="px-6 py-3 text-[13px] font-bold text-emerald-700">{fmt(e.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.history && data.history.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Audit Trail</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.history.map(h => (
                <div key={h.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                    <span className="text-[12px] font-bold text-slate-900">{h.action}</span>
                    <span className="text-[11px] text-slate-500">{h.fromState} → {h.toState}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{h.actorName} · {h.actorRole}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'default' }) {
  return (
    <div className={`p-5 border rounded-[20px] ${tone === 'emerald' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );
}
