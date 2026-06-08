"use client";

import React, { useState, useMemo } from 'react';
import { useAccess } from '@/context/AccessContext';
import { useLeave } from '@/context/LeaveContext';
import {
  Plus, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, ChevronDown, X, Send
} from 'lucide-react';

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave', 'Compassionate Leave', 'Study Leave', 'Unpaid Leave'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  DRAFT: { label: 'Draft', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  SUBMITTED: { label: 'Pending Manager Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  MANAGER_APPROVED: { label: 'Pending HR Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' },
};

export default function MyLeavePage() {
  const { user } = useAccess();
  const { requests: allRequests, submitLeaveRequest } = useLeave();
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const employeeId = user?.employeeId || user?.id || 'EMP-001';

  // Filter requests for this specific logged-in user
  const requests = useMemo(() => {
    return allRequests.filter(r => r.employeeId === employeeId);
  }, [allRequests, employeeId]);

  const pendingCount = requests.filter(r => r.currentState === 'SUBMITTED' || r.currentState === 'MANAGER_APPROVED').length;
  const approvedCount = requests.filter(r => r.currentState === 'APPROVED').length;
  const annualBalance = 18;
  const sickBalance = 10;

  function calcDays(start: string, end: string) {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diff);
  }

  const handleSubmit = () => {
    if (!form.type || !form.startDate || !form.endDate || !form.reason) return;
    setSubmitting(true);
    
    // Simulate slight network delay for premium feel
    setTimeout(() => {
      const days = calcDays(form.startDate, form.endDate);
      submitLeaveRequest({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        days,
        reason: form.reason,
      });
      setForm({ type: '', startDate: '', endDate: '', reason: '' });
      setShowModal(false);
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Leave</h1>
            <p className="text-[13px] font-medium text-slate-400 mt-1">
              Welcome, <span className="text-slate-600 font-bold">{user?.name || 'Employee'}</span> · Manage your time-off requests
            </p>
          </div>
          <button
            id="btn-new-leave-request"
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-black text-white px-5 h-[44px] rounded-[12px] text-[11px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            New Request
          </button>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Annual Balance', value: annualBalance, unit: 'days', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Sick Balance', value: sickBalance, unit: 'days', color: 'bg-sky-50 border-sky-100 text-sky-700' },
            { label: 'Pending', value: pendingCount, unit: 'req.', color: 'bg-amber-50 border-amber-100 text-amber-700' },
            { label: 'Approved', value: approvedCount, unit: 'req.', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          ].map((b) => (
            <div key={b.label} className={`p-5 rounded-[20px] border ${b.color} space-y-1`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">{b.label}</p>
              <p className="text-3xl font-black">{b.value} <span className="text-base font-medium opacity-60">{b.unit}</span></p>
            </div>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Request History</h2>
          </div>

          {requests.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Requests Yet</h3>
              <p className="text-[13px] text-slate-400 mt-1">Click &quot;New Request&quot; to apply for time off.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => {
                const cfg = statusConfig[req.currentState] || statusConfig.DRAFT;
                const StatusIcon = cfg.icon;
                const submittedDate = req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : '—';
                const lastApproval = req.history.find(h => h.toState === 'APPROVED' || h.toState === 'MANAGER_APPROVED');
                const reviewedBy = lastApproval ? lastApproval.actorName : undefined;
                return (
                  <div key={req.id} className="flex items-center justify-between px-7 py-5 hover:bg-slate-50/60 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center ${cfg.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-slate-900">{req.type}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.id}</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium">
                          {req.startDate} → {req.endDate} · <span className="font-bold">{req.days} {req.days === 1 ? 'day' : 'days'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[11px] text-slate-400">Submitted {submittedDate}</p>
                        {reviewedBy && <p className="text-[11px] text-slate-400 mt-0.5">by {reviewedBy}</p>}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">New Leave Request</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Submit for manager approval</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-7 space-y-5">
              {/* Leave Type */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Leave Type</label>
                <div className="relative">
                  <select
                    id="leave-type-select"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-3 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  >
                    <option value="">Select leave type…</option>
                    {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Start Date</label>
                  <input
                    id="leave-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-3 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">End Date</label>
                  <input
                    id="leave-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-3 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>
              </div>
              {form.startDate && form.endDate && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[12px] font-bold text-indigo-700">{calcDays(form.startDate, form.endDate)} working days requested</span>
                </div>
              )}
              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reason</label>
                <textarea
                  id="leave-reason"
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of your leave reason…"
                  className="w-full px-4 py-3 text-[13px] text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                />
              </div>
              <button
                id="btn-submit-leave"
                onClick={handleSubmit}
                disabled={submitting || !form.type || !form.startDate || !form.endDate || !form.reason}
                className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="animate-pulse">Submitting…</span>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Submit Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
