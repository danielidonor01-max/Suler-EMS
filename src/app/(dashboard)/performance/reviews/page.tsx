"use client";

import React, { useState } from 'react';
import {
  FileText, Star, Send, CheckCircle2, AlertTriangle, Clock, Edit3, Users,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { Modal } from '@/components/common/Modal';

interface ReviewRow {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED';
  overallRating: number | null;
  strengths: string | null;
  areasForGrowth: string | null;
  reviewerComments: string | null;
  employeeComments: string | null;
  submittedAt: string | null;
  employeeAcknowledgedAt: string | null;
  cycle: { id: string; name: string; type: string; dueDate: string | null; status: string };
  employee: { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string; branch: string | null };
  reviewer: { id: string; name: string; email: string } | null;
  _redactedReason?: string;
}

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  PENDING:      { text: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  IN_PROGRESS:  { text: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-100' },
  SUBMITTED:    { text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-100' },
  ACKNOWLEDGED: { text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
};

export default function ReviewsPage() {
  const { userRole } = useAccess();
  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [tab, setTab] = useState<'mine' | 'toConduct' | 'all'>('toConduct');
  const [editing, setEditing] = useState<ReviewRow | null>(null);

  const { data: rows = [], refresh } = useApi<ReviewRow[]>(
    `/api/performance/reviews?scope=${tab}`,
    { pollMs: 30_000 },
  );

  const stats = {
    pending:      rows.filter(r => r.status === 'PENDING').length,
    inProgress:   rows.filter(r => r.status === 'IN_PROGRESS').length,
    awaitingAck:  rows.filter(r => r.status === 'SUBMITTED').length,
    done:         rows.filter(r => r.status === 'ACKNOWLEDGED').length,
  };

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Performance Reviews
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
          Reviews
        </h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[540px]">
          Reviewers fill out ratings and comments here. Subject employees acknowledge submitted reviews once they read them.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Pending"        value={`${stats.pending}`}     variant="tonal-info"    icon={Clock} />
        <MetricCard label="In Progress"    value={`${stats.inProgress}`}  variant="tonal-warning" icon={Edit3} />
        <MetricCard label="Awaiting Ack"   value={`${stats.awaitingAck}`} variant="tonal-info"    icon={Send} />
        <MetricCard label="Done"           value={`${stats.done}`}        variant="tonal-success" icon={CheckCircle2} />
      </div>

      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
        <TabBtn active={tab === 'toConduct'} onClick={() => setTab('toConduct')} icon={Edit3} label="To Conduct" />
        <TabBtn active={tab === 'mine'}      onClick={() => setTab('mine')}      icon={FileText} label="My Reviews" />
        {isHR && <TabBtn active={tab === 'all'} onClick={() => setTab('all')} icon={Users} label="All" />}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {tab === 'toConduct' ? 'Nothing to review' : tab === 'mine' ? 'No reviews assigned to you yet' : 'No reviews in the system'}
          </h3>
          <p className="text-[13px] text-slate-500 max-w-[400px] mx-auto">
            {tab === 'toConduct'
              ? 'HR will let you know when reviews are ready to fill out.'
              : tab === 'mine'
                ? 'When a review cycle includes you, the rows will appear here.'
                : 'Create a cycle and assign reviews from the Cycles page.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rows.map(r => (
            <ReviewCard key={r.id} review={r} tab={tab} onOpen={() => setEditing(r)} />
          ))}
        </div>
      )}

      <ReviewModal
        review={editing}
        tab={tab}
        onClose={() => setEditing(null)}
        onChanged={() => { setEditing(null); refresh(); }}
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

function ReviewCard({
  review, tab, onOpen,
}: {
  review: ReviewRow;
  tab: 'mine' | 'toConduct' | 'all';
  onOpen: () => void;
}) {
  const tone = STATUS_TONE[review.status] ?? STATUS_TONE.PENDING;
  const showEmployee = tab !== 'mine';

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug">{review.cycle.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
              {review.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.cycle.type}</span>
            {review.cycle.dueDate && (
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(review.cycle.dueDate))}
              </span>
            )}
          </div>
        </div>
      </div>

      {showEmployee && (
        <EmployeeChip
          employeeId={review.employee.id}
          name={`${review.employee.firstName} ${review.employee.lastName}`}
          sublabel={review.employee.jobTitle}
          size="sm"
        />
      )}

      {review.overallRating && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              className={`w-4 h-4 ${n <= (review.overallRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          ))}
          <span className="ml-2 text-[12px] font-bold text-slate-700">{review.overallRating} / 5</span>
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center justify-center gap-2 px-4 h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
      >
        {tab === 'toConduct' && (review.status === 'PENDING' || review.status === 'IN_PROGRESS') ? 'Fill Review' :
         tab === 'mine' && review.status === 'SUBMITTED' ? 'View & Acknowledge' :
         'View Details'}
      </button>
    </div>
  );
}

// ─── Review modal ───────────────────────────────────────────────────────────

function ReviewModal({
  review, tab, onClose, onChanged,
}: {
  review: ReviewRow | null;
  tab: 'mine' | 'toConduct' | 'all';
  onClose: () => void;
  onChanged: () => void;
}) {
  const [rating, setRating]         = useState(0);
  const [strengths, setStrengths]   = useState('');
  const [areas, setAreas]           = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [empComments, setEmpComments]   = useState('');
  const [busy, setBusy]   = useState<'save' | 'submit' | 'ack' | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!review) return;
    setRating(review.overallRating ?? 0);
    setStrengths(review.strengths ?? '');
    setAreas(review.areasForGrowth ?? '');
    setReviewerNote(review.reviewerComments ?? '');
    setEmpComments(review.employeeComments ?? '');
    setError(null);
  }, [review]);

  if (!review) return null;

  const isReviewerView = tab === 'toConduct' || tab === 'all';
  const isSubjectView  = tab === 'mine';
  const canEditReviewer = isReviewerView && (review.status === 'PENDING' || review.status === 'IN_PROGRESS');
  const canSubmit       = isReviewerView && (review.status === 'PENDING' || review.status === 'IN_PROGRESS');
  const canAcknowledge  = isSubjectView && review.status === 'SUBMITTED';

  const save = async () => {
    setBusy('save'); setError(null);
    try {
      await apiMutate(`/api/performance/reviews/${review.id}`, 'PATCH', {
        overallRating:    rating || null,
        strengths:        strengths || null,
        areasForGrowth:   areas || null,
        reviewerComments: reviewerNote || null,
      });
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!rating) { setError('Set an overall rating before submitting.'); return; }
    if (!confirm('Submit this review? The subject employee will be notified and able to read it.')) return;
    setBusy('submit'); setError(null);
    try {
      // Save current edits first (so they don't get lost if the user
      // changed something but didn't click Save).
      await apiMutate(`/api/performance/reviews/${review.id}`, 'PATCH', {
        overallRating:    rating || null,
        strengths:        strengths || null,
        areasForGrowth:   areas || null,
        reviewerComments: reviewerNote || null,
      });
      await apiMutate(`/api/performance/reviews/${review.id}/submit`, 'POST');
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? 'Submit failed');
    } finally {
      setBusy(null);
    }
  };

  const acknowledge = async () => {
    setBusy('ack'); setError(null);
    try {
      await apiMutate(`/api/performance/reviews/${review.id}/acknowledge`, 'POST', {
        employeeComments: empComments || null,
      });
      onChanged();
    } catch (err: any) {
      setError(err?.message ?? 'Acknowledge failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal isOpen={!!review} onClose={onClose} title={review.cycle.name} subtitle={`${review.employee.firstName} ${review.employee.lastName} — ${review.employee.jobTitle}`} size="lg">
      <div className="space-y-6">

        {review._redactedReason && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-slate-700">{review._redactedReason}</span>
          </div>
        )}

        {/* Reviewer fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => canEditReviewer && setRating(n)}
                  disabled={!canEditReviewer}
                  aria-label={`Rate ${n} out of 5`}
                  className="disabled:cursor-default"
                >
                  <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} ${canEditReviewer ? 'hover:text-amber-300' : ''}`} />
                </button>
              ))}
              {rating > 0 && <span className="ml-3 text-[14px] font-bold text-slate-900">{rating} / 5</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strengths</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
              disabled={!canEditReviewer}
              placeholder="What went well? Be specific."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-default"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Areas for Growth</label>
            <textarea
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              rows={3}
              disabled={!canEditReviewer}
              placeholder="What could improve? Constructive examples beat vague platitudes."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-default"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewer Comments</label>
            <textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
              disabled={!canEditReviewer}
              placeholder="Overall narrative — direction, context, anything outside the bullets above."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-default"
            />
          </div>
        </div>

        {/* Subject employee response */}
        {(review.status === 'SUBMITTED' || review.status === 'ACKNOWLEDGED') && (
          <div className="space-y-1.5 border-t border-slate-100 pt-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Employee Response
              {review.status === 'ACKNOWLEDGED' && (
                <span className="ml-2 text-emerald-600">· Acknowledged {review.employeeAcknowledgedAt ? new Date(review.employeeAcknowledgedAt).toLocaleDateString() : ''}</span>
              )}
            </label>
            <textarea
              value={empComments}
              onChange={(e) => setEmpComments(e.target.value)}
              rows={3}
              disabled={!canAcknowledge}
              placeholder={canAcknowledge ? 'Optional response before you acknowledge — questions, context, push-back.' : ''}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-default"
            />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Close
          </button>
          {canEditReviewer && (
            <button
              type="button"
              onClick={save}
              disabled={busy !== null}
              className="flex-1 h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {busy === 'save' ? 'Saving…' : 'Save Draft'}
            </button>
          )}
          {canSubmit && (
            <button
              type="button"
              onClick={submit}
              disabled={busy !== null}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {busy === 'submit' ? 'Submitting…' : 'Submit Review'}
            </button>
          )}
          {canAcknowledge && (
            <button
              type="button"
              onClick={acknowledge}
              disabled={busy !== null}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
            >
              {busy === 'ack' ? 'Acknowledging…' : 'Acknowledge'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
