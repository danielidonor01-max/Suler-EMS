'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import {
  Mail, Phone, Briefcase, Building2, MapPin, Shield, IdCard, Pencil, Save, X, AlertCircle,
  KeyRound, CheckCircle2, Send, Clock, XCircle,
} from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/forms/Select';
import { MfaPanel } from '@/components/profile/MfaPanel';

interface Profile {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  version: number;
  lastLoginAt: string | null;
  mfaEnabled?: boolean;
  mfaLastUsedAt?: string | null;
  role: { id: string; name: string; permissions: Array<{ code: string; name: string }> };
  employee: {
    id: string;
    staffId: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    branch: string | null;
    phone: string | null;
    grade: string | null;
    createdAt: string;
    department: { id: string; name: string; code: string } | null;
  } | null;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

interface ChangeRequest {
  id: string;
  field: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, error, isLoading, mutate } = useSWR<Profile>(
    session?.user?.id ? '/api/profile' : null,
    apiFetcher,
  );

  // Pulls the calling user's change requests so we can show pending +
  // recent on the page itself instead of forcing them to check the
  // notifications bell.
  const { data: changeRequests = [], mutate: refreshRequests } = useSWR<ChangeRequest[]>(
    session?.user?.id ? '/api/profile/change-requests?scope=mine' : null,
    apiFetcher,
    { refreshInterval: 30_000 },
  );

  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // `phoneDraft = null` means "not editing". Any string (including empty)
  // means we're in edit mode. This avoids the prop-sync useEffect that the
  // react-hooks/set-state-in-effect rule (correctly) flags.
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const editingPhone = phoneDraft !== null;
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  async function savePhone() {
    if (phoneDraft === null) return;
    setSaving(true);
    setBannerError(null);
    try {
      await apiMutate('/api/profile', 'PATCH', { phone: phoneDraft.trim() || null });
      await mutate();
      setPhoneDraft(null);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to update phone');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-slate-100 rounded-[20px]" />
          <div className="h-64 bg-slate-100 rounded-[20px]" />
        </div>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-[20px] text-[13px] text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Could not load your profile. {error?.message ?? 'Try refreshing the page.'}</span>
        </div>
      </div>
    );
  }

  const emp = profile.employee;
  const displayName = profile.name || (emp ? `${emp.firstName} ${emp.lastName}`.trim() : profile.email);

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-[24px] p-7 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
          <div className="w-20 h-20 bg-slate-900 rounded-[20px] flex items-center justify-center text-white text-2xl font-bold shadow-premium shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
            <p className="text-slate-500 text-[13px] mt-1">
              {emp?.jobTitle ?? 'Staff'}
              {emp?.department?.name ? ` · ${emp.department.name}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700">
                <Shield className="w-3 h-3" />
                {profile.role.name}
              </span>
              {emp?.staffId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-700 font-mono">
                  <IdCard className="w-3 h-3" />
                  {emp.staffId}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${profile.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {savedTick && (
          <div className="px-4 py-3 rounded-[12px] bg-emerald-50 border border-emerald-100 text-[12px] text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Phone updated.
          </div>
        )}
        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {bannerError}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Personal Details</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                You can edit your phone directly. For everything else, send a request — HR reviews and applies it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0"
            >
              <Send className="w-3 h-3" />
              Request Change
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            <ProfileRow icon={Mail}        label="Email"      value={profile.email} />
            <ProfileRow icon={Briefcase}   label="Job Title"  value={emp?.jobTitle} />
            <ProfileRow icon={Building2}   label="Department" value={emp?.department?.name} />
            <ProfileRow icon={MapPin}      label="Branch"     value={emp?.branch} />
            <PhoneRow
              value={emp?.phone}
              editing={editingPhone}
              draft={phoneDraft ?? ''}
              onDraftChange={(v) => setPhoneDraft(v)}
              onEdit={() => setPhoneDraft(emp?.phone ?? '')}
              onCancel={() => setPhoneDraft(null)}
              onSave={savePhone}
              saving={saving}
            />
          </div>
        </div>

        {changeRequests.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">My Change Requests</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Status of recent profile change submissions. HR is notified when you submit.
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {changeRequests.filter(r => r.status === 'PENDING').length} pending
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {changeRequests.slice(0, 8).map(r => (
                <ChangeRequestRow
                  key={r.id}
                  request={r}
                  onCancel={async () => {
                    try {
                      await apiMutate(`/api/profile/change-requests/${r.id}`, 'PATCH', {
                        action: 'CANCEL',
                      });
                      await refreshRequests();
                    } catch (err) {
                      setBannerError(err instanceof Error ? err.message : 'Could not cancel request');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" />
            <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Access &amp; Permissions</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-[12px] text-slate-500">
              Permissions are derived from your role <span className="font-mono font-bold text-slate-700">{profile.role.name}</span>. To change them, an administrator must update the role at <a href="/admin/roles" className="text-indigo-600 font-bold hover:underline">Governance → Roles &amp; Permissions</a>.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.role.permissions.length === 0 ? (
                <span className="text-[12px] text-slate-400">No permissions granted.</span>
              ) : (
                profile.role.permissions.map(p => (
                  <span key={p.code} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono bg-slate-50 border border-slate-100 text-slate-700">
                    {p.code}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <MfaPanel
          enabled={Boolean(profile.mfaEnabled)}
          lastUsedAt={profile.mfaLastUsedAt ?? null}
          onChange={async () => { await mutate(); }}
        />

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Session</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <ProfileRow icon={KeyRound} label="Last Login"
              value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'} />
            <ProfileRow icon={Shield} label="Session Version" value={String(profile.version)} mono />
          </div>
        </div>
      </div>

      <RequestChangeModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        currentValues={{
          firstName: emp?.firstName ?? '',
          lastName:  emp?.lastName ?? '',
          phone:     emp?.phone ?? '',
          jobTitle:  emp?.jobTitle ?? '',
          grade:     emp?.grade ?? '',
          branch:    emp?.branch ?? '',
        }}
        onSubmitted={() => {
          setRequestModalOpen(false);
          refreshRequests();
        }}
      />
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value, mono }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 shrink-0">{label}</span>
      <span className={`text-[13px] flex-1 ${mono ? 'font-mono' : 'font-medium'} text-slate-900 truncate`}>{value || '—'}</span>
    </div>
  );
}

// ─── Change request row ─────────────────────────────────────────────────────

const FIELD_LABEL: Record<string, string> = {
  firstName: 'First Name',
  lastName:  'Last Name',
  phone:     'Phone',
  jobTitle:  'Job Title',
  grade:     'Grade',
  branch:    'Branch / Hub',
  nin:       'NIN',
  bvn:       'BVN',
  tin:       'TIN',
  pensionPFA: 'Pension PFA',
  pensionNumber: 'Pension Number',
  nhfNumber: 'NHF Number',
};

const STATUS_TONE: Record<string, { text: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }> = {
  PENDING:   { text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100',   Icon: Clock },
  APPROVED:  { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', Icon: CheckCircle2 },
  REJECTED:  { text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100',    Icon: XCircle },
  CANCELLED: { text: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   Icon: X },
};

function ChangeRequestRow({ request, onCancel }: { request: ChangeRequest; onCancel: () => void | Promise<void> }) {
  const tone = STATUS_TONE[request.status] ?? STATUS_TONE.PENDING;
  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
        <tone.Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold text-slate-900">
            {FIELD_LABEL[request.field] ?? request.field}
          </span>
          <span className="text-[11px] text-slate-500 line-through truncate max-w-[140px]">{request.currentValue ?? '—'}</span>
          <span className="text-[11px] text-slate-400">→</span>
          <span className="text-[12px] font-bold text-slate-900 truncate max-w-[140px]">{request.proposedValue ?? '—'}</span>
          <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${tone.text} ${tone.bg} ${tone.border}`}>
            {request.status}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 italic line-clamp-1">&ldquo;{request.reason}&rdquo;</div>
        {request.status === 'REJECTED' && request.reviewComment && (
          <div className="text-[11px] text-rose-600 mt-0.5">Reviewer: {request.reviewComment}</div>
        )}
      </div>
      {request.status === 'PENDING' && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] font-bold text-slate-500 hover:text-rose-600 uppercase tracking-widest shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ─── Request modal ──────────────────────────────────────────────────────────

interface RequestableValues {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  grade: string;
  branch: string;
}

const REQUESTABLE_FIELDS: Array<{ value: string; label: string }> = [
  { value: 'firstName',     label: 'First Name' },
  { value: 'lastName',      label: 'Last Name' },
  { value: 'jobTitle',      label: 'Job Title' },
  { value: 'grade',         label: 'Grade' },
  { value: 'branch',        label: 'Branch / Hub' },
  { value: 'nin',           label: 'NIN' },
  { value: 'bvn',           label: 'BVN' },
  { value: 'tin',           label: 'TIN' },
  { value: 'pensionPFA',    label: 'Pension PFA' },
  { value: 'pensionNumber', label: 'Pension Number' },
  { value: 'nhfNumber',     label: 'NHF Number' },
];

function RequestChangeModal({
  isOpen, onClose, onSubmitted, currentValues,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  currentValues: RequestableValues;
}) {
  const [field, setField] = useState('jobTitle');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setField('jobTitle'); setProposedValue(''); setReason(''); setError(null);
    }
  }, [isOpen]);

  // Show the current value as a hint underneath the field selector so
  // the requester can see what they're changing from.
  const currentValueHint = (currentValues as any)[field] ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/profile/change-requests', 'POST', {
        field,
        proposedValue: proposedValue.trim() || null,
        reason: reason.trim(),
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.message ?? 'Could not send request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Profile Change" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 animate-in">
        <p className="text-[12px] text-slate-500">
          HR will review your request and apply the change. You&apos;ll get a notification when it&apos;s actioned.
        </p>

        <Select
          label="Field to Change"
          value={field}
          onChange={setField}
          options={REQUESTABLE_FIELDS}
        />
        {currentValueHint && (
            <div className="text-[11px] text-slate-500 px-1">
              Current value: <span className="font-bold text-slate-700">{currentValueHint}</span>
            </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed Value (optional)</label>
          <input
            value={proposedValue}
            onChange={(e) => setProposedValue(e.target.value)}
            placeholder="Leave blank if you want HR to clear the field"
            aria-label="Proposed value"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason (required)</label>
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            aria-label="Reason"
            placeholder="Explain why this needs changing — e.g. legal name update, correction of typo, etc."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send to HR'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PhoneRow({ value, editing, draft, onDraftChange, onEdit, onCancel, onSave, saving }: {
  value: string | null | undefined;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Phone className="w-4 h-4" />
      </div>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 shrink-0">Phone</span>
      <span className="text-[13px] flex-1 flex items-center gap-2">
        {editing ? (
          <>
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              aria-label="Phone number"
              placeholder="+234…"
              className="flex-1 h-9 px-3 rounded-[10px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
            />
            <button type="button" disabled={saving} onClick={onSave}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest">
              <Save className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onCancel} aria-label="Cancel"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-slate-400 hover:bg-slate-50">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-900 truncate">{value || '—'}</span>
            <button type="button" onClick={onEdit} aria-label="Edit phone"
              className="inline-flex items-center gap-1 h-7 px-2 ml-2 rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </>
        )}
      </span>
    </div>
  );
}
