"use client";

/**
 * Budget creation form. Targets POST /api/finance/budgets which expects:
 *   { name, fiscalYear, period, departmentId?, totalAmount, categories[] }
 *
 * Categories are optional. When supplied, their allocatedAmount must
 * not exceed totalAmount — the form validates this client-side so the
 * user doesn't have to wait for the server round-trip to find out.
 *
 * Created budgets land in DRAFT and require a separate Activate action
 * before they accept expenditures. That gate is intentional — Finance
 * doesn't want a typo'd budget paying out by accident.
 */

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, AlertTriangle, Banknote } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { apiMutate } from '@/lib/api/fetcher';
import { useApi } from '@/lib/api/use-api';

interface Department { id: string; name: string }
interface Category {
  name:            string;
  code:            string;
  allocatedAmount: number;
}

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onSaved:  () => void;
}

const PERIODS: Array<'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'MONTHLY'> = [
  'ANNUAL', 'Q1', 'Q2', 'Q3', 'Q4', 'MONTHLY',
];

function fmtNGN(n: number): string {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function BudgetFormModal({ isOpen, onClose, onSaved }: Props) {
  const currentYear = new Date().getFullYear();

  const [name,         setName]         = useState('');
  const [fiscalYear,   setFiscalYear]   = useState(`FY${currentYear}`);
  const [period,       setPeriod]       = useState<typeof PERIODS[number]>('ANNUAL');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [totalAmount,  setTotalAmount]  = useState<number>(0);
  const [description,  setDescription]  = useState('');
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [busy,         setBusy]         = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const { data: departments = [] } = useApi<Department[]>(isOpen ? '/api/departments' : null);

  // Reset when the modal opens fresh.
  React.useEffect(() => {
    if (!isOpen) return;
    setName('');
    setFiscalYear(`FY${currentYear}`);
    setPeriod('ANNUAL');
    setDepartmentId('');
    setTotalAmount(0);
    setDescription('');
    setCategories([]);
    setError(null);
  }, [isOpen, currentYear]);

  const allocatedSum = useMemo(
    () => categories.reduce((s, c) => s + (Number.isFinite(c.allocatedAmount) ? c.allocatedAmount : 0), 0),
    [categories],
  );
  const overAllocated = allocatedSum > totalAmount;

  const addCategory = () => {
    setCategories(prev => [...prev, { name: '', code: '', allocatedAmount: 0 }]);
  };
  const updateCategory = (i: number, field: keyof Category, value: string | number) => {
    setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };
  const removeCategory = (i: number) => {
    setCategories(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Name is required.');
    if (totalAmount <= 0) return setError('Total amount must be greater than zero.');
    if (overAllocated) {
      return setError(`Categories allocate ${fmtNGN(allocatedSum)} but the budget is only ${fmtNGN(totalAmount)}.`);
    }
    // Drop empty category rows; the server schema requires name ≥ 2.
    const cleanCategories = categories
      .filter(c => c.name.trim().length >= 2)
      .map(c => ({
        name:            c.name.trim(),
        code:            c.code.trim() || undefined,
        allocatedAmount: c.allocatedAmount,
      }));

    setBusy(true);
    try {
      await apiMutate('/api/finance/budgets', 'POST', {
        name:         name.trim(),
        fiscalYear:   fiscalYear.trim(),
        period,
        departmentId: departmentId || null,
        totalAmount,
        description:  description.trim() || undefined,
        categories:   cleanCategories.length > 0 ? cleanCategories : undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not create budget');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Budget" subtitle="Lands in DRAFT — activate to start accepting expenditures" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lagos Operations FY2026"
            aria-label="Name" required minLength={2} maxLength={120}
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fiscal Year" required>
            <input
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="FY2026"
              aria-label="Fiscal year" required
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </Field>
          <Field label="Period" required>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof PERIODS[number])}
              aria-label="Period"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Department">
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              aria-label="Department"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
            >
              <option value="">Org-wide (no department)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Total Amount" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-bold">₦</span>
              <input
                type="number" min={1} step="1" required
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                aria-label="Total amount"
                className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 text-[13px] font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this budget covers."
            aria-label="Description"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories (optional)</label>
            <button
              type="button"
              onClick={addCategory}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {categories.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No categories — the budget accepts uncategorized expenditures.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_140px_auto] gap-2 items-center">
                  <input
                    type="text" placeholder="Category name"
                    value={c.name}
                    onChange={(e) => updateCategory(i, 'name', e.target.value)}
                    aria-label={`Category ${i + 1} name`}
                    className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text" placeholder="Code"
                    value={c.code}
                    onChange={(e) => updateCategory(i, 'code', e.target.value)}
                    aria-label={`Category ${i + 1} code`}
                    className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] outline-none focus:border-indigo-500"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">₦</span>
                    <input
                      type="number" min={0} step="1"
                      value={c.allocatedAmount}
                      onChange={(e) => updateCategory(i, 'allocatedAmount', parseFloat(e.target.value) || 0)}
                      aria-label={`Category ${i + 1} amount`}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-5 pr-2 text-[12px] font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button" onClick={() => removeCategory(i)}
                    aria-label={`Remove category ${i + 1}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-[11px] font-bold ${
              overAllocated ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5" />
                Categories total
              </span>
              <span>{fmtNGN(allocatedSum)} of {fmtNGN(totalAmount)}</span>
            </div>
          )}
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
          <button type="submit" disabled={busy || overAllocated}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Creating…' : 'Create Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
