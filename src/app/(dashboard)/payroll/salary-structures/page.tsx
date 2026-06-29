"use client";

import React, { useMemo, useState } from 'react';
import {
  Banknote, Plus, Edit3, Trash2, Search, AlertTriangle,
  CheckCircle2, History, Wallet,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { Modal } from '@/components/common/Modal';
import { DatePicker } from '@/components/forms/DatePicker';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/ToastContext';
import { NIGERIAN_BANKS, codeForBank } from '@/lib/banking/nigerian-banks';

interface Employee {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  branch: string | null;
  department: { id: string; name: string } | null;
  bankName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
}

interface SalaryStructure {
  id: string;
  employeeId: string;
  effectiveDate: string;
  isActive: boolean;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: Array<{ name: string; amount: number; taxable: boolean }> | null;
  reason: string | null;
  createdAt: string;
}

function num(v: string | number): number {
  return typeof v === 'number' ? v : Number(v);
}
function fmtNGN(v: string | number): string {
  return `₦${num(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
function totalGross(s: SalaryStructure): number {
  const others = (s.otherAllowances ?? []).reduce((acc, a) => acc + Number(a.amount), 0);
  return num(s.basicSalary) + num(s.housingAllowance) + num(s.transportAllowance) + others;
}

export default function SalaryStructuresPage() {
  const { userRole } = useAccess();
  const isAdmin = ['FINANCE_MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '');

  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: employees = [], refresh: refreshEmployees } = useApi<Employee[]>(isAdmin ? '/api/employees' : null);

  // Filter by search; respect status if we get a list shape with status.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter(e =>
      e.firstName.toLowerCase().includes(needle)
      || e.lastName.toLowerCase().includes(needle)
      || e.staffId.toLowerCase().includes(needle)
      || (e.jobTitle ?? '').toLowerCase().includes(needle),
    );
  }, [employees, q]);

  if (!isAdmin) {
    return (
      <div className="section-breathing max-w-[900px] mx-auto p-8">
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Not authorized</h3>
          <p className="text-[13px] text-slate-500">Salary structures require Finance / HR / SUPER_ADMIN.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Banknote className="w-3 h-3" />
            Compensation
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
          Salary Structures
        </h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[600px]">
          Active structure feeds the next payroll run. Past structures are kept for audit but can&apos;t be edited — create a new one to change someone&apos;s comp.
        </p>
      </div>

      <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, staff ID, or job title…"
            aria-label="Search employees"
            className="flex-1 bg-transparent outline-none text-[13px] font-medium text-slate-900 placeholder:text-slate-400"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} employees</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map(e => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-4 ${selected?.id === e.id ? 'bg-indigo-50' : ''}`}
            >
              <EmployeeChip employeeId={e.id} name={`${e.firstName} ${e.lastName}`} sublabel={e.jobTitle} size="sm" />
              <div className="ml-auto flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept</div>
                  <div className="text-[12px] font-bold text-slate-700">{e.department?.name ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank</div>
                  <div className="text-[12px] font-bold text-slate-700">
                    {e.bankName ? `${e.bankName}` : <span className="text-rose-500">Missing</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-[13px] text-slate-500">No employees match that search.</div>
          )}
        </div>
      </div>

      <EmployeeDetailModal
        employee={selected}
        onClose={() => setSelected(null)}
        onCreate={() => setCreateOpen(true)}
        onEmployeeUpdated={async () => {
          // Re-fetch the employee list so the on-file bank chip in the
          // row updates immediately, and refresh the modal's banner
          // by re-selecting the merged employee from the new list.
          await refreshEmployees();
          if (selected) {
            const fresh = (employees ?? []).find(e => e.id === selected.id);
            if (fresh) setSelected(fresh);
          }
        }}
      />
      <CreateStructureModal
        employee={selected}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => setCreateOpen(false)}
      />
    </div>
  );
}

function EmployeeDetailModal({
  employee, onClose, onCreate, onEmployeeUpdated,
}: {
  employee: Employee | null;
  onClose: () => void;
  onCreate: () => void;
  /** Called after an inline edit (bank details) lands so the page list refreshes. */
  onEmployeeUpdated: () => void;
}) {
  const { data: structures = [], refresh } = useApi<SalaryStructure[]>(
    employee ? `/api/payroll/salary-structures?employeeId=${employee.id}` : null,
  );
  const confirm = useConfirm();
  const { addToast } = useToast();

  if (!employee) return null;

  const active = structures.find(s => s.isActive);
  const history = structures.filter(s => !s.isActive);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title:        'Delete this salary structure?',
      message:      'Active structures cannot be deleted. Use the form to create a new one if you need to revise comp.',
      confirmLabel: 'Delete',
      tone:         'danger',
    });
    if (!ok) return;
    try {
      await apiMutate(`/api/payroll/salary-structures/${id}`, 'DELETE');
      await refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed', 'ERROR');
    }
  };

  return (
    <Modal
      isOpen={!!employee}
      onClose={onClose}
      title={`${employee.firstName} ${employee.lastName}`}
      subtitle={`${employee.jobTitle} · ${employee.staffId}`}
      size="lg"
    >
      <div className="space-y-6">

        {/* Bank info banner — inline edit so HR doesn't have to navigate
            to the profile modal to fix the most common reason payroll
            disbursement skips someone. */}
        <BankBanner
          employee={employee}
          onSaved={async () => {
            await onEmployeeUpdated();
            addToast('Bank details saved.', 'SUCCESS');
          }}
        />

        {/* Active */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-slate-900">Active Structure</h3>
            <button
              type="button"
              onClick={onCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" />
              New Structure
            </button>
          </div>
          {active ? (
            <StructureCard structure={active} variant="active" onDelete={() => handleDelete(active.id)} />
          ) : (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl text-center text-[13px] text-amber-700">
              No active salary structure. Create one to include this employee in payroll runs.
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-[13px] font-bold text-slate-700">History ({history.length})</h3>
            </div>
            <div className="space-y-2">
              {history.map(s => (
                <StructureCard
                  key={s.id}
                  structure={s}
                  variant="history"
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StructureCard({
  structure, variant, onDelete,
}: {
  structure: SalaryStructure;
  variant: 'active' | 'history';
  onDelete: () => void;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      variant === 'active' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Effective</div>
          <div className="text-[13px] font-bold text-slate-900">
            {new Date(structure.effectiveDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        {variant === 'history' && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete structure"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <KV label="Basic"     value={fmtNGN(structure.basicSalary)} />
        <KV label="Housing"   value={fmtNGN(structure.housingAllowance)} />
        <KV label="Transport" value={fmtNGN(structure.transportAllowance)} />
        <KV label="Gross"     value={fmtNGN(totalGross(structure))} bold />
      </div>
      {(structure.otherAllowances ?? []).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
          {structure.otherAllowances!.map((a, i) => (
            <div key={i} className="flex items-center justify-between">
              <span>{a.name} {a.taxable && <span className="text-slate-400">(taxable)</span>}</span>
              <span className="font-bold">{fmtNGN(a.amount)}</span>
            </div>
          ))}
        </div>
      )}
      {structure.reason && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 italic">
          {structure.reason}
        </div>
      )}
    </div>
  );
}

function BankBanner({
  employee, onSaved,
}: {
  employee: Employee;
  onSaved: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [bankName, setBankName] = useState(employee.bankName ?? '');
  const [account,  setAccount]  = useState(employee.bankAccountNumber ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when the modal switches to a different employee.
  React.useEffect(() => {
    if (editing) return;
    setBankName(employee.bankName ?? '');
    setAccount(employee.bankAccountNumber ?? '');
    setError(null);
  }, [editing, employee.id, employee.bankName, employee.bankAccountNumber]);

  const hasAccount = !!employee.bankAccountNumber;

  const handleSave = async () => {
    if (account.trim() && !/^\d{10}$/.test(account.trim())) {
      setError('Account number should be 10 digits.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const derivedCode = bankName ? codeForBank(bankName) : null;
      await apiMutate(`/api/employees/${employee.id}/profile`, 'PATCH', {
        bankName:          bankName.trim() || null,
        bankCode:          derivedCode,
        bankAccountNumber: account.trim() || null,
      });
      setEditing(false);
      await onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save bank details');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        hasAccount ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
      }`}>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank Account</div>
          <div className="text-[13px] font-bold text-slate-900 mt-1">
            {hasAccount
              ? `${employee.bankName ?? '—'} · ${employee.bankAccountNumber}`
              : 'Not on file — payroll disbursement will skip this employee'}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAccount ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Edit3 className="w-3 h-3" />
            {hasAccount ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank Account</div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
        <select
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          aria-label="Bank Name"
          className="w-full h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
        >
          <option value="">Select a bank…</option>
          {NIGERIAN_BANKS.map(b => (
            <option key={b.code} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number (10 digits)</label>
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          inputMode="numeric"
          maxLength={10}
          aria-label="Account number"
          className="w-full h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-[13px] font-bold tracking-wider outline-none focus:border-indigo-500"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{error}</span>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setEditing(false); setError(null); }}
          disabled={busy}
          className="flex-1 h-10 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex-1 h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className={`text-[12px] ${bold ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{value}</div>
    </div>
  );
}

/** First day of next month, ISO yyyy-mm-dd. Payroll runs monthly; new
 * comp typically takes effect at the start of the next pay period, so
 * that's the sensible default rather than "today". */
function firstOfNextMonth(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return d.toISOString().slice(0, 10);
}

function CreateStructureModal({
  employee, isOpen, onClose, onSaved,
}: {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Re-fetches the same URL EmployeeDetailModal already used — SWR
  // dedup (5s window) means it's a single round-trip in practice.
  // Used to surface a delta chip vs the current gross when entering
  // the new structure.
  const { data: existingStructures = [] } = useApi<SalaryStructure[]>(
    isOpen && employee ? `/api/payroll/salary-structures?employeeId=${employee.id}` : null,
  );
  const currentActiveGross = useMemo(() => {
    const active = existingStructures.find(s => s.isActive);
    return active ? totalGross(active) : null;
  }, [existingStructures]);

  const [effectiveDate, setEffectiveDate] = useState(firstOfNextMonth());
  const [basicSalary,   setBasicSalary]   = useState<number>(0);
  const [housing,       setHousing]       = useState<number>(0);
  const [transport,     setTransport]     = useState<number>(0);
  const [reason,        setReason]        = useState('');
  const [allowances,    setAllowances]    = useState<Array<{ name: string; amount: number; taxable: boolean }>>([]);
  const [busy,          setBusy]          = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setEffectiveDate(firstOfNextMonth());
    setBasicSalary(0);
    setHousing(0);
    setTransport(0);
    setReason('');
    setAllowances([]);
    setError(null);
  }, [isOpen]);

  if (!employee) return null;

  const addAllowance = () => setAllowances(prev => [...prev, { name: '', amount: 0, taxable: true }]);
  const updateAllowance = (i: number, field: 'name' | 'amount' | 'taxable', value: any) => {
    setAllowances(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };
  const removeAllowance = (i: number) => {
    setAllowances(prev => prev.filter((_, idx) => idx !== i));
  };

  const gross = basicSalary + housing + transport + allowances.reduce((s, a) => s + a.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/payroll/salary-structures', 'POST', {
        employeeId:         employee.id,
        effectiveDate,
        basicSalary,
        housingAllowance:   housing,
        transportAllowance: transport,
        otherAllowances:    allowances.filter(a => a.name.trim() && a.amount > 0),
        reason:             reason || null,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save structure');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Salary Structure" subtitle={`${employee.firstName} ${employee.lastName}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Effective From"
            value={effectiveDate}
            onChange={setEffectiveDate}
          />
          <Field label="Basic Salary">
            <MoneyInput value={basicSalary} onChange={setBasicSalary} />
          </Field>
          <Field label="Housing">
            <MoneyInput value={housing} onChange={setHousing} />
          </Field>
          <Field label="Transport">
            <MoneyInput value={transport} onChange={setTransport} />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Allowances</label>
            <button
              type="button"
              onClick={addAllowance}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {allowances.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic">No additional allowances</div>
          ) : (
            <div className="space-y-2">
              {allowances.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_auto_auto] gap-2 items-center">
                  <input
                    type="text" placeholder="Allowance name"
                    value={a.name}
                    onChange={(e) => updateAllowance(i, 'name', e.target.value)}
                    aria-label={`Allowance ${i + 1} name`}
                    className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] outline-none focus:border-indigo-500"
                  />
                  <MoneyInput value={a.amount} onChange={(v) => updateAllowance(i, 'amount', v)} small />
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={a.taxable}
                      onChange={(e) => updateAllowance(i, 'taxable', e.target.checked)}
                      aria-label={`Allowance ${i + 1} taxable`}
                      className="w-3.5 h-3.5 accent-indigo-600"
                    /> Taxable
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAllowance(i)}
                    aria-label={`Remove allowance ${i + 1}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gross Total</span>
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-black text-slate-900">{fmtNGN(gross)}</span>
            {/* Delta chip — only when there's a prior active structure and
                the user has entered values. Helps HR catch a typo (a
                ₦5,000,000 raise should jump out visually) before they
                hit Save. */}
            {currentActiveGross != null && gross > 0 && gross !== currentActiveGross && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                gross > currentActiveGross
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {gross > currentActiveGross ? '+' : '−'}{fmtNGN(Math.abs(gross - currentActiveGross))}
              </span>
            )}
          </div>
        </div>

        <Field label="Reason (optional)">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Promotion, annual review, role change…"
            aria-label="Reason"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
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
          <button type="submit" disabled={busy || basicSalary <= 0}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Saving…' : 'Save Structure'}
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

function MoneyInput({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  // Show empty string when the value is 0 so the user doesn't have to
  // backspace a leading zero before typing. This is the most common
  // complaint with raw number inputs — typing "5" with the field at
  // "0" produces "05" which the browser then strips, leaving "5", but
  // the cursor jumps. Treating 0 as "" sidesteps the whole dance.
  return (
    <div className="relative">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${small ? 'text-[11px]' : 'text-[12px]'} font-bold`}>₦</span>
      <input
        type="number"
        min={0}
        step="1"
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        aria-label="Amount"
        className={`w-full bg-slate-50 border border-slate-200 rounded-${small ? 'lg' : 'xl'} pl-6 pr-3 text-[13px] font-bold outline-none focus:border-indigo-500 ${small ? 'h-9 text-[12px]' : 'h-[44px]'}`}
      />
    </div>
  );
}
