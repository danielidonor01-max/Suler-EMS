'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/modals/Modal';
import { apiFetcher } from '@/lib/api/fetcher';
import { useFinance } from '@/context/FinanceContext';

interface BudgetDetail {
  id: string;
  name: string;
  totalAmount: string | number;
  spentAmount: string | number;
  currency?: string;
  categories?: Array<{ id: string; name: string; code: string | null; allocatedAmount: string | number; spentAmount: string | number }>;
  utilization: { remainingAmount: number; utilizationPercent: number };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

function fmtNGN(n: number) {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export function ExpenditureSubmitModal({ isOpen, onClose, onSubmitted }: Props) {
  const { budgets, submitExpenditureV2 } = useFinance();

  const [budgetId, setBudgetId] = useState<string>('');
  const [budgetDetail, setBudgetDetail] = useState<BudgetDetail | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to first active budget when modal opens.
  useEffect(() => {
    if (isOpen && !budgetId && budgets.length > 0) {
      setBudgetId(budgets[0].id);
    }
  }, [isOpen, budgets, budgetId]);

  // Fetch full budget detail (with categories) whenever selection changes.
  useEffect(() => {
    if (!budgetId) {
      setBudgetDetail(null);
      setCategoryId('');
      return;
    }
    let cancelled = false;
    apiFetcher<BudgetDetail>(`/api/finance/budgets/${budgetId}`)
      .then(b => {
        if (cancelled) return;
        setBudgetDetail(b);
        setCategoryId(b.categories?.[0]?.id ?? '');
      })
      .catch(() => { if (!cancelled) setBudgetDetail(null); });
    return () => { cancelled = true; };
  }, [budgetId]);

  const remaining = useMemo(() => {
    if (!budgetDetail) return 0;
    return Number(budgetDetail.utilization.remainingAmount);
  }, [budgetDetail]);

  const amountNum = parseFloat(amount || '0');
  const exceeds = amountNum > 0 && amountNum > remaining;

  function reset() {
    setBudgetId(''); setBudgetDetail(null); setCategoryId('');
    setAmount(''); setDescription(''); setVendor('');
    setError(null); setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!budgetId || !amountNum || !description.trim()) {
      setError('Budget, amount, and description are required.');
      return;
    }
    if (exceeds) {
      setError(`Amount exceeds remaining budget (${fmtNGN(remaining)}).`);
      return;
    }
    setSubmitting(true);
    try {
      await submitExpenditureV2({
        budgetId,
        categoryId: categoryId || null,
        amount: amountNum,
        description: description.trim(),
        vendor: vendor.trim() || undefined,
      });
      reset();
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose} description="Submit a finance request against an active budget. Amount becomes immutable on submission.">
          New Expenditure
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Budget</label>
            <select
              value={budgetId} onChange={(e) => setBudgetId(e.target.value)}
              className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="" disabled>Choose a budget…</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} — remaining {fmtNGN(b.remaining)}
                </option>
              ))}
            </select>
            {budgetDetail && (
              <p className="mt-2 text-[11px] text-slate-500">
                Remaining: <span className="font-bold text-slate-700">{fmtNGN(remaining)}</span> · Utilization: {budgetDetail.utilization.utilizationPercent}%
              </p>
            )}
          </div>

          {budgetDetail?.categories && budgetDetail.categories.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
              <select
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">No category</option>
                {budgetDetail.categories.map(c => {
                  const catRemaining = Number(c.allocatedAmount) - Number(c.spentAmount);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.code ? ` (${c.code})` : ''} — remaining {fmtNGN(catRemaining)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount (₦)</label>
              <input
                type="number" min="0" step="0.01" required
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`mt-2 w-full h-[44px] px-4 rounded-[12px] border text-[13px] text-slate-900 bg-white focus:outline-none ${exceeds ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'}`}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendor (optional)</label>
              <input
                value={vendor} onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. AWS, Air Peace"
                className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="What is this expenditure for?"
              className="mt-2 w-full px-4 py-3 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500 resize-none"
              required minLength={3}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{error}</div>
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose}
            className="h-[44px] px-5 rounded-[12px] text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting || exceeds}
            className="h-[44px] px-6 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest shadow-premium disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
