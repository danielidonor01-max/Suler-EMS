'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/modals/Modal';
import { apiMutate } from '@/lib/api/fetcher';

type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY' | 'PATERNITY' | 'COMPASSIONATE';

const TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'COMPASSIONATE', label: 'Compassionate Leave' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function LeaveSubmitModal({ isOpen, onClose, onSubmitted }: Props) {
  const [type, setType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType('ANNUAL'); setStartDate(''); setEndDate(''); setReason('');
    setError(null); setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate || !reason) {
      setError('All fields are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date.');
      return;
    }
    setSubmitting(true);
    try {
      await apiMutate('/api/leave/requests', 'POST', { type, startDate, endDate, reason });
      reset();
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose} description="Tell your manager when you'll be out and why.">
          Submit Leave Request
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Leave Type</label>
            <select
              value={type} onChange={(e) => setType(e.target.value as LeaveType)}
              className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)}
              rows={3} placeholder="A short reason your manager can review."
              className="mt-2 w-full px-4 py-3 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500 resize-none"
              required minLength={3}
            />
          </div>
          {error && (
            <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">
              {error}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose}
            className="h-[44px] px-5 rounded-[12px] text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="h-[44px] px-6 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest shadow-premium disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
