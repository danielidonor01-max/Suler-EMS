'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Mail, Phone, Briefcase, Building2, MapPin, Shield, IdCard, Pencil, Save, X, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface Profile {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  version: number;
  lastLoginAt: string | null;
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

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, error, isLoading, mutate } = useSWR<Profile>(
    session?.user?.id ? '/api/profile' : null,
    apiFetcher,
  );

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
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Personal Details</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Most fields are managed by HR. Contact your administrator to update name, role, or staff ID.</p>
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
