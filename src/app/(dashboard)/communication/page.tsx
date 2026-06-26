"use client";

import React, { useMemo, useState } from 'react';
import {
  MessageSquare, Megaphone, Plus, CheckCircle2, Clock,
  ArrowRight, Activity, ShieldCheck, Target, Users, AlertTriangle,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Modal } from '@/components/common/Modal';
import { useCommunication } from '@/context/CommunicationContext';
import { useApi } from '@/lib/api/use-api';
import { useToast } from '@/components/common/ToastContext';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export default function CommunicationPage() {
  const { conversations, postBroadcast, createConversation, refreshAll } = useCommunication();
  const { addToast } = useToast();

  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [threadOpen,    setThreadOpen]    = useState(false);

  // Split feed: announcements (BROADCAST type, synthesized server-side) vs
  // direct + group threads. Both come from the same conversations array on
  // the context — the type field discriminates.
  const broadcasts = useMemo(
    () => conversations.filter(c => c.type === 'BROADCAST'),
    [conversations],
  );
  const threads = useMemo(
    () => conversations.filter(c => c.type !== 'BROADCAST'),
    [conversations],
  );

  const unreadTotal = threads.reduce((s, t) => s + (t.unreadCount ?? 0), 0);

  return (
    <div className="animate-in space-y-12">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Encrypted Operational Channels
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter leading-none">
              Communication Hub
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">
              Unified surface for broadcasts and inter-team threads. Compose a broadcast or open a thread directly here.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all shadow-premium"
          >
            <Megaphone className="w-4 h-4" />
            New Broadcast
          </button>
        </div>
      </div>

      {/* Metrics are derived from the live conversations feed — no fake
          trend chips. Active threads count direct + group; the broadcasts
          tile counts in-flight announcements (anything not expired). */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Threads" value={`${threads.length}`} variant="tonal-info" icon={MessageSquare} />
        <MetricCard label="Broadcasts"     value={`${broadcasts.length}`} variant="tonal-info" icon={Megaphone} />
        <MetricCard
          label="Unread"
          value={`${unreadTotal}`}
          variant={unreadTotal > 0 ? 'tonal-warning' : 'tonal-success'}
          icon={Clock}
        />
        <MetricCard label="Network" value="Online" variant="tonal-success" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900">Strategic Broadcasts</h2>
          </div>

          {broadcasts.length === 0 ? (
            <EmptyCard message="No broadcasts in flight. Use New Broadcast to post one." />
          ) : (
            <div className="space-y-4">
              {broadcasts.map(b => (
                <div key={b.id} className="bg-white p-6 rounded-[24px] border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex items-start justify-between gap-6">
                  <div className="flex gap-6 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Activity className="w-6 h-6 stroke-[1.5px]" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-medium uppercase tracking-[0.15em]">
                          {b.scope ?? 'GLOBAL'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{fmtRelative(b.lastMessageAt ?? null)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">{b.title}</h3>
                      <p className="text-[12px] font-medium text-slate-500 line-clamp-2">{b.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-[12px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-900">Active Threads</h2>
          </div>

          <div className="space-y-3">
            {threads.length === 0 ? (
              <EmptyCard message="No threads yet — start one to coordinate with teammates." />
            ) : threads.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-[16px] border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${(t.unreadCount ?? 0) > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {t.type === 'DM' ? 'Direct' : 'Group'}
                      {(t.unreadCount ?? 0) > 0 && <span className="text-rose-600 ml-2">{t.unreadCount} new</span>}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{fmtRelative(t.lastMessageAt ?? null)}</span>
                </div>
                <h4 className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight truncate">{t.title}</h4>
                {t.lastMessage && (
                  <p className="text-[12px] font-medium text-slate-500 line-clamp-1 mt-1 italic">&ldquo;{t.lastMessage}&rdquo;</p>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setThreadOpen(true)}
              className="w-full py-4 rounded-[16px] border border-dashed border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 hover:bg-white transition-all flex items-center justify-center gap-2.5"
            >
              <Plus className="w-4 h-4" />
              Initiate Thread
            </button>
          </div>
        </div>
      </div>

      <NewBroadcastModal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onPosted={async () => {
          await refreshAll();
          addToast('Broadcast posted.', 'SUCCESS');
        }}
        postBroadcast={postBroadcast}
      />
      <NewThreadModal
        isOpen={threadOpen}
        onClose={() => setThreadOpen(false)}
        onCreated={async () => {
          await refreshAll();
          addToast('Thread started.', 'SUCCESS');
        }}
        createConversation={createConversation}
      />
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-[12px] text-slate-500">
      {message}
    </div>
  );
}

function NewBroadcastModal({
  isOpen, onClose, onPosted, postBroadcast,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPosted: () => Promise<void> | void;
  postBroadcast: (title: string, content: string, scope: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL') => Promise<void>;
}) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [scope,   setScope]   = useState<'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL'>('GLOBAL');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(''); setContent(''); setScope('GLOBAL'); setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('Title and content are both required.');
      return;
    }
    setBusy(true);
    try {
      await postBroadcast(title.trim(), content.trim(), scope);
      await onPosted();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not post broadcast.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Broadcast" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required minLength={2} maxLength={200}
            placeholder="e.g. Q3 Strategy Update"
            aria-label="Title"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </Field>
        <Field label="Message" required>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5} required minLength={2} maxLength={5000}
            placeholder="The body of the announcement. Visible to everyone in the chosen scope."
            aria-label="Message"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </Field>
        <Field label="Scope">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            aria-label="Scope"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          >
            <option value="GLOBAL">Global — everyone</option>
            <option value="HUB">Hub — your hub only</option>
            <option value="DEPARTMENT">Department — your department</option>
            <option value="TEAM">Team — your teams</option>
          </select>
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
          <button type="submit" disabled={busy}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Posting…' : 'Post Broadcast'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewThreadModal({
  isOpen, onClose, onCreated, createConversation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  createConversation: (participants: string[], title?: string, type?: 'DM' | 'GROUP') => Promise<string>;
}) {
  const [title,    setTitle]    = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter,   setFilter]   = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const { data: users = [] } = useApi<UserOption[]>(isOpen ? '/api/communication/contacts' : null);

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(''); setSelected(new Set()); setFilter(''); setError(null);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, filter]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selected.size === 0) {
      setError('Pick at least one participant.');
      return;
    }
    const isGroup = selected.size > 1;
    if (isGroup && !title.trim()) {
      setError('Group threads need a title.');
      return;
    }
    setBusy(true);
    try {
      await createConversation(Array.from(selected), title.trim() || undefined, isGroup ? 'GROUP' : 'DM');
      await onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not start the thread.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Thread" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={`Participants ${selected.size > 0 ? `(${selected.size} selected)` : ''}`}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or email…"
            aria-label="Filter contacts"
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[12px] outline-none focus:border-indigo-500 mb-2"
          />
          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-slate-400">
                {filter ? 'No contacts match.' : 'No contacts available.'}
              </div>
            ) : filtered.map(u => {
              const checked = selected.has(u.id);
              return (
                <label key={u.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${checked ? 'bg-indigo-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(u.id)}
                    aria-label={`Select ${u.name}`}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-slate-900 truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        {selected.size > 1 && (
          <Field label="Group title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required maxLength={120}
              placeholder="e.g. Payroll review — September"
              aria-label="Group title"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </Field>
        )}

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
          <button type="submit" disabled={busy || selected.size === 0}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            {busy ? 'Starting…' : 'Start Thread'}
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
