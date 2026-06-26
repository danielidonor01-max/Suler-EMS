"use client";

import React, { useMemo, useState } from 'react';
import {
  MessageSquare, Plus, Clock, CheckCircle2, XCircle, Star,
  AlertTriangle, Send, Users, X,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { EmployeeChip } from '@/components/employees/EmployeeChip';
import { Modal } from '@/components/common/Modal';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/ToastContext';

interface FeedbackRow {
  id: string;
  status: 'PENDING' | 'SUBMITTED' | 'DECLINED';
  prompt: string | null;
  strengths: string | null;
  improvements: string | null;
  comments: string | null;
  rating: number | null;
  submittedAt: string | null;
  declinedReason: string | null;
  createdAt: string;
  subject:     { id: string; staffId: string; firstName: string; lastName: string; jobTitle: string };
  reviewer:    { id: string; name: string; email: string };
  requestedBy: { id: string; name: string; email: string };
  cycle: { id: string; name: string; status: string } | null;
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
}

const STATUS_TONE: Record<string, { text: string; bg: string; border: string }> = {
  PENDING:   { text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  SUBMITTED: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  DECLINED:  { text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function PeerFeedbackPage() {
  const { userRole } = useAccess();
  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [tab, setTab] = useState<'pending' | 'received' | 'given' | 'all'>('pending');
  const [requestOpen, setRequestOpen] = useState(false);
  const [responding, setResponding] = useState<FeedbackRow | null>(null);
  const [viewing, setViewing] = useState<FeedbackRow | null>(null);

  const { data: rows = [], refresh } = useApi<FeedbackRow[]>(
    `/api/performance/feedback?scope=${tab}`,
    { pollMs: 30_000 },
  );

  const stats = useMemo(() => ({
    pending:   rows.filter(r => r.status === 'PENDING').length,
    submitted: rows.filter(r => r.status === 'SUBMITTED').length,
    declined:  rows.filter(r => r.status === 'DECLINED').length,
    avgRating: (() => {
      const rated = rows.filter(r => r.rating != null);
      if (!rated.length) return 0;
      return Math.round((rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length) * 10) / 10;
    })(),
  }), [rows]);

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                360° Feedback
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Peer Feedback
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[540px]">
              Ask peers for feedback. Manager reviews tell you one perspective; 360°s round it out — the people you ship with day-to-day see things managers don&apos;t.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Request Feedback
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard label="Pending"   value={`${stats.pending}`}   variant="tonal-warning" icon={Clock} />
        <MetricCard label="Submitted" value={`${stats.submitted}`} variant="tonal-success" icon={CheckCircle2} />
        <MetricCard label="Declined"  value={`${stats.declined}`}  variant="tonal-info"    icon={XCircle} />
        <MetricCard label="Avg Rating" value={stats.avgRating ? `${stats.avgRating} / 5` : '—'} variant="tonal-info" icon={Star} />
      </div>

      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit flex-wrap">
        <TabBtn active={tab === 'pending'}  onClick={() => setTab('pending')}  icon={Clock}        label="Pending for Me" />
        <TabBtn active={tab === 'received'} onClick={() => setTab('received')} icon={MessageSquare} label="About Me" />
        <TabBtn active={tab === 'given'}    onClick={() => setTab('given')}    icon={Send}         label="I Reviewed" />
        {isHR && <TabBtn active={tab === 'all'} onClick={() => setTab('all')}  icon={Users}        label="All (HR)" />}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {tab === 'pending' ? 'Nothing in your queue' :
             tab === 'received' ? 'No feedback yet' :
             tab === 'given' ? 'You haven\'t reviewed anyone yet' :
             'No feedback requests'}
          </h3>
          <p className="text-[13px] text-slate-500 max-w-[420px] mx-auto">
            {tab === 'pending' ? 'When a peer asks you for feedback, it lands here.' :
             tab === 'received' ? 'Ask a peer for feedback to start collecting perspectives.' :
             tab === 'given' ? 'Once you submit feedback for a peer, it shows up here.' :
             'No active peer-feedback requests across the org.'}
          </p>
          {(tab === 'received' || tab === 'pending') && (
            <button
              type="button"
              onClick={() => setRequestOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3.5 h-3.5" />
              Request Feedback
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rows.map(r => (
            <FeedbackCard
              key={r.id}
              row={r}
              currentUserId={undefined /* not needed — server-side scoping handles auth */}
              onRespond={() => setResponding(r)}
              onView={() => setViewing(r)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <RequestFeedbackModal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSubmitted={() => { setRequestOpen(false); refresh(); }}
      />
      <RespondModal
        row={responding}
        onClose={() => setResponding(null)}
        onSubmitted={() => { setResponding(null); refresh(); }}
      />
      <ViewResponseModal
        row={viewing}
        onClose={() => setViewing(null)}
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

function FeedbackCard({
  row, onRespond, onView, onChanged,
}: {
  row: FeedbackRow;
  currentUserId?: string;
  onRespond: () => void;
  onView: () => void;
  onChanged: () => void;
}) {
  const tone = STATUS_TONE[row.status] ?? STATUS_TONE.PENDING;
  const hasResponse = row.status === 'SUBMITTED';
  const confirm = useConfirm();
  const { addToast } = useToast();

  const handleWithdraw = async () => {
    const ok = await confirm({
      title:        'Withdraw this feedback request?',
      message:      'The reviewer will no longer see it in their queue.',
      confirmLabel: 'Withdraw',
      tone:         'danger',
    });
    if (!ok) return;
    try {
      await apiMutate(`/api/performance/feedback/${row.id}`, 'DELETE');
      onChanged();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Withdraw failed', 'ERROR');
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
            {row.status}
          </span>
          {row.cycle && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.cycle.name}</span>
          )}
          <span className="text-[10px] font-bold text-slate-400">{fmtDate(row.createdAt)}</span>
        </div>
        {row.status === 'PENDING' && (
          <button
            type="button"
            onClick={handleWithdraw}
            aria-label="Withdraw request"
            title="Withdraw"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</div>
          <EmployeeChip
            employeeId={row.subject.id}
            name={`${row.subject.firstName} ${row.subject.lastName}`}
            sublabel={row.subject.jobTitle}
            size="sm"
          />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewer</div>
          <div className="text-[13px] font-bold text-slate-900">{row.reviewer.name}</div>
          <div className="text-[11px] text-slate-500">{row.reviewer.email}</div>
        </div>
      </div>

      {row.prompt && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prompt</div>
          <p className="text-[12px] text-slate-700 leading-relaxed">{row.prompt}</p>
        </div>
      )}

      {row.status === 'DECLINED' && row.declinedReason && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Decline reason</div>
          <p className="text-[12px] text-rose-700 leading-relaxed">{row.declinedReason}</p>
        </div>
      )}

      {hasResponse && row.rating != null && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              className={`w-4 h-4 ${n <= (row.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
            />
          ))}
          <span className="text-[11px] font-bold text-slate-600 ml-2">{row.rating} / 5</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {row.status === 'PENDING' && (
          <button
            type="button"
            onClick={onRespond}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            <Send className="w-3 h-3" />
            Respond
          </button>
        )}
        {hasResponse && (
          <button
            type="button"
            onClick={onView}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            View Response
          </button>
        )}
      </div>
    </div>
  );
}

function RequestFeedbackModal({
  isOpen, onClose, onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [prompt, setPrompt]                 = useState('');
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [busy, setBusy]                     = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // Reuse the reviewers endpoint built for the reviewer-picker.
  const { data: reviewers = [] } = useApi<Reviewer[]>(isOpen ? '/api/performance/reviewers' : null);

  React.useEffect(() => {
    if (!isOpen) return;
    setPrompt('');
    setSelectedIds(new Set());
    setError(null);
  }, [isOpen]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError('Pick at least one peer.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/performance/feedback', 'POST', {
        reviewerIds: Array.from(selectedIds),
        prompt:      prompt || null,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message ?? 'Could not send requests');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Peer Feedback" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prompt (optional)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="What should they focus on? e.g. &lsquo;Communication and follow-through this quarter.&rsquo;"
            aria-label="Prompt"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Pick reviewers ({selectedIds.size} selected)
          </label>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {reviewers.length === 0 && (
              <div className="p-4 text-[12px] text-slate-500 text-center">No reviewers available</div>
            )}
            {reviewers.map(u => {
              const isSel = selectedIds.has(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${isSel ? 'bg-indigo-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggle(u.id)}
                    aria-checked={isSel}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 truncate">{u.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
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
          <button type="submit" disabled={busy || selectedIds.size === 0}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Sending…' : `Send ${selectedIds.size} request${selectedIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RespondModal({
  row, onClose, onSubmitted,
}: {
  row: FeedbackRow | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [strengths, setStrengths]       = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments]         = useState('');
  const [rating, setRating]             = useState<number | null>(null);
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [decliningMode, setDecliningMode] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  React.useEffect(() => {
    if (!row) return;
    setStrengths('');
    setImprovements('');
    setComments('');
    setRating(null);
    setError(null);
    setDecliningMode(false);
    setDeclineReason('');
  }, [row]);

  if (!row) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/performance/feedback/${row.id}/submit`, 'POST', {
        strengths:    strengths || null,
        improvements: improvements || null,
        comments:     comments || null,
        rating,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message ?? 'Could not submit feedback');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/performance/feedback/${row.id}/decline`, 'POST', {
        reason: declineReason || null,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message ?? 'Could not decline');
    } finally {
      setBusy(false);
    }
  };

  const subjectName = `${row.subject.firstName} ${row.subject.lastName}`;

  return (
    <Modal isOpen={!!row} onClose={onClose} title="Give Feedback" subtitle={`About ${subjectName}`} size="md">
      {decliningMode ? (
        <div className="space-y-4">
          <p className="text-[13px] text-slate-600">
            Tell us briefly why you&apos;re declining. This is shared with HR but not with {row.subject.firstName}.
          </p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="e.g. I haven&apos;t worked closely enough with them this period."
            aria-label="Decline reason"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span className="text-[12px] font-medium text-rose-700">{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setDecliningMode(false)} disabled={busy}
              className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
              Back
            </button>
            <button type="button" onClick={handleDecline} disabled={busy}
              className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
              {busy ? 'Declining…' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {row.prompt && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">They asked</div>
              <p className="text-[12px] text-slate-700 leading-relaxed">{row.prompt}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strengths</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
              placeholder="What are they doing well that they should keep doing?"
              aria-label="Strengths"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Areas to grow</label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
              placeholder="One or two specific things that would compound for them."
              aria-label="Areas to grow"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other comments (optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
              aria-label="Other comments"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall rating (optional)</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  aria-label={`${n} stars`}
                  className="p-1"
                >
                  <Star className={`w-6 h-6 ${rating != null && n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
              {rating != null && (
                <span className="text-[11px] font-bold text-slate-600 ml-2">{rating} / 5</span>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span className="text-[12px] font-medium text-rose-700">{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setDecliningMode(true)} disabled={busy}
              className="px-5 h-11 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
              Decline
            </button>
            <button type="button" onClick={onClose} disabled={busy}
              className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
              Save Later
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
              {busy ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ViewResponseModal({
  row, onClose,
}: {
  row: FeedbackRow | null;
  onClose: () => void;
}) {
  if (!row) return null;
  const subjectName = `${row.subject.firstName} ${row.subject.lastName}`;

  return (
    <Modal isOpen={!!row} onClose={onClose} title="Feedback Response" subtitle={`About ${subjectName} — from ${row.reviewer.name}`} size="md">
      <div className="space-y-5">
        {row.rating != null && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                className={`w-5 h-5 ${n <= (row.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
              />
            ))}
            <span className="text-[12px] font-bold text-slate-600 ml-2">{row.rating} / 5</span>
          </div>
        )}

        {row.strengths && (
          <Section label="Strengths" body={row.strengths} />
        )}
        {row.improvements && (
          <Section label="Areas to grow" body={row.improvements} />
        )}
        {row.comments && (
          <Section label="Other comments" body={row.comments} />
        )}
        {!row.strengths && !row.improvements && !row.comments && row.rating == null && (
          <p className="text-[13px] text-slate-500">No written content — rating only.</p>
        )}

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">
          Submitted {fmtDate(row.submittedAt)}
        </div>

        <button type="button" onClick={onClose}
          className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest">
          Close
        </button>
      </div>
    </Modal>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  );
}
