'use client';

/**
 * Centred employee profile modal.
 *
 * One reusable surface for "show me this person's profile" no matter
 * where the click originated — workforce registry, staff list, team
 * card, leave admin row, payroll register row. Behaviour is driven
 * entirely by the API's `capabilities` flags:
 *
 *   capabilities.canEdit          — HR / SUPER_ADMIN / settings:manage
 *                                   → renders the Save form
 *   capabilities.canEditSelf      — the logged-in user is THIS employee
 *                                   → renders the "Request Update" form
 *                                     if NOT canEdit
 *   capabilities.canViewCompliance — show full NIN/BVN/TIN; otherwise
 *                                    masked values render
 *
 * The compliance section is collapsed by default to keep first-paint
 * focused on identity + employment.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail, Phone, Briefcase, Building2, ShieldCheck, AlertTriangle,
  CheckCircle2, Edit3, Lock, ChevronDown, ChevronUp, Send,
  FileText, Download, Upload, Trash2, Paperclip,
  CreditCard, Banknote, Save,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

interface ProfilePayload {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  grade: string | null;
  branch: string | null;
  status: string;
  createdAt: string;

  department: { id: string; code: string; name: string; hub: { id: string; code: string; name: string } | null } | null;
  hub: { id: string; code: string; name: string } | null;
  user: { id: string; email: string; isActive: boolean; lastLoginAt: string | null; role: { id: string; name: string }; createdAt: string } | null;
  teams: Array<{ membershipId: string; role: string | null; joinedAt: string; team: { id: string; code: string; name: string } }>;

  compliance: {
    nin: string | null;
    bvn: string | null;
    tin: string | null;
    pensionPFA: string | null;
    pensionNumber: string | null;
    nhfNumber: string | null;
    nsitfNumber: string | null;
    itfNumber: string | null;
  };

  banking: {
    bankName:          string | null;
    bankCode:          string | null;
    bankAccountNumber: string | null;
  };

  compensation: {
    effectiveDate:      string;
    basicSalary:        number;
    housingAllowance:   number;
    transportAllowance: number;
    otherAllowances:    number;
    grossMonthly:       number;
    currency:           string;
  } | null;

  capabilities: {
    canEdit: boolean;
    canEditSelf: boolean;
    canViewCompliance: boolean;
    canViewBanking: boolean;
    canEditBanking: boolean;
    canViewCompensation: boolean;
  };
}

interface Props {
  employeeId: string | null;
  onClose: () => void;
}

export function EmployeeProfileModal({ employeeId, onClose }: Props) {
  const isOpen = !!employeeId;
  const { data, isLoading, refresh } = useApi<ProfilePayload>(
    isOpen ? `/api/employees/${employeeId}/profile` : null,
    { pollMs: false },
  );

  const [mode, setMode] = useState<'view' | 'edit' | 'request'>('view');
  const [showCompliance, setShowCompliance] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset transient state when the target changes.
  useEffect(() => {
    if (isOpen) {
      setMode('view');
      setShowCompliance(false);
      setFormError(null);
      setFormSuccess(null);
    }
  }, [isOpen, employeeId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Profile" subtitle={data?.staffId} size="lg">
      {!data || isLoading ? (
        <div className="p-12 text-center text-[12px] text-slate-500">Loading…</div>
      ) : mode === 'edit' ? (
        <EditForm
          profile={data}
          busy={busy}
          error={formError}
          success={formSuccess}
          onCancel={() => { setMode('view'); setFormError(null); setFormSuccess(null); }}
          onSave={async (patch) => {
            setBusy(true); setFormError(null); setFormSuccess(null);
            try {
              await apiMutate(`/api/employees/${data.id}/profile`, 'PATCH', patch);
              await refresh();
              setFormSuccess('Profile saved.');
              setMode('view');
            } catch (err: any) {
              setFormError(err?.message ?? 'Could not save changes');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : mode === 'request' ? (
        <RequestForm
          profile={data}
          busy={busy}
          error={formError}
          success={formSuccess}
          onCancel={() => { setMode('view'); setFormError(null); setFormSuccess(null); }}
          onSubmit={async ({ field, proposedValue, reason }) => {
            setBusy(true); setFormError(null); setFormSuccess(null);
            try {
              const res = await apiMutate<unknown, { recipientCount: number; message: string }>(
                '/api/profile/change-requests', 'POST',
                { field, proposedValue, reason },
              );
              setFormSuccess(res.message ?? 'Request sent.');
              setMode('view');
            } catch (err: any) {
              setFormError(err?.message ?? 'Could not send request');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : (
        <ViewBlock
          profile={data}
          showCompliance={showCompliance}
          onToggleCompliance={() => setShowCompliance(v => !v)}
          onEdit={() => setMode('edit')}
          onRequest={() => setMode('request')}
          flashSuccess={formSuccess}
        />
      )}
    </Modal>
  );
}

// ─── View block ──────────────────────────────────────────────────────────────

function ViewBlock({
  profile, showCompliance, onToggleCompliance, onEdit, onRequest, flashSuccess,
}: {
  profile: ProfilePayload;
  showCompliance: boolean;
  onToggleCompliance: () => void;
  onEdit: () => void;
  onRequest: () => void;
  flashSuccess: string | null;
}) {
  const initials = useMemo(
    () => `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase(),
    [profile],
  );

  return (
    <div className="space-y-6 animate-in">
      {/* Identity header */}
      <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[18px] font-black shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">{profile.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] font-bold text-slate-500">{profile.jobTitle}</span>
            <StatusPill status={profile.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{profile.email}</span>
            {profile.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{profile.phone}</span>}
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {profile.staffId}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {profile.capabilities.canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          ) : profile.capabilities.canEditSelf ? (
            <button
              type="button"
              onClick={onRequest}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Request Update
            </button>
          ) : null}
        </div>
      </div>

      {flashSuccess && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-emerald-700">{flashSuccess}</span>
        </div>
      )}

      {/* Employment */}
      <Section icon={Briefcase} title="Employment">
        <Field label="Job Title" value={profile.jobTitle} />
        <Field label="Grade" value={profile.grade ?? '—'} />
        <Field label="Department" value={profile.department?.name ?? '—'} />
        <Field label="Hub" value={profile.hub?.name ?? profile.branch ?? '—'} />
        <Field label="Role" value={profile.user?.role.name ?? 'No account'} />
        <Field label="Joined" value={formatDate(profile.createdAt)} />
      </Section>

      {/* Teams */}
      {profile.teams.length > 0 && (
        <Section icon={Building2} title="Teams">
          <div className="col-span-2 flex flex-wrap gap-2">
            {profile.teams.map(t => (
              <span
                key={t.membershipId}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
              >
                {t.team.name}{t.role ? ` · ${t.role}` : ''}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Banking */}
      <BankingSection profile={profile} />

      {/* Compensation */}
      {profile.capabilities.canViewCompensation && (
        <CompensationSection compensation={profile.compensation} />
      )}

      {/* Documents */}
      <DocumentsSection
        employeeId={profile.id}
        canManage={profile.capabilities.canEdit}
      />

      {/* Compliance (collapsible) */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={onToggleCompliance}
          className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {profile.capabilities.canViewCompliance ? (
              <ShieldCheck className="w-4 h-4 text-slate-500" />
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              Compliance & Statutory
            </span>
            {!profile.capabilities.canViewCompliance && (
              <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded border border-amber-100">
                Masked
              </span>
            )}
          </div>
          {showCompliance ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showCompliance && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 bg-white">
            <Field label="NIN" value={profile.compliance.nin ?? '—'} />
            <Field label="BVN" value={profile.compliance.bvn ?? '—'} />
            <Field label="TIN" value={profile.compliance.tin ?? '—'} />
            <Field label="Pension PFA" value={profile.compliance.pensionPFA ?? '—'} />
            <Field label="Pension #" value={profile.compliance.pensionNumber ?? '—'} />
            <Field label="NHF #" value={profile.compliance.nhfNumber ?? '—'} />
            <Field label="NSITF #" value={profile.compliance.nsitfNumber ?? '—'} />
            <Field label="ITF #" value={profile.compliance.itfNumber ?? '—'} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit form (HR / admin path) ─────────────────────────────────────────────

function EditForm({
  profile, onCancel, onSave, busy, error, success,
}: {
  profile: ProfilePayload;
  onCancel: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  error: string | null;
  success: string | null;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName,  setLastName]  = useState(profile.lastName);
  const [phone,     setPhone]     = useState(profile.phone ?? '');
  const [jobTitle,  setJobTitle]  = useState(profile.jobTitle);
  const [grade,     setGrade]     = useState(profile.grade ?? '');
  const [branch,    setBranch]    = useState(profile.branch ?? '');
  const [status,    setStatus]    = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>(profile.status as any);

  const [nin, setNin] = useState(profile.compliance.nin ?? '');
  const [bvn, setBvn] = useState(profile.compliance.bvn ?? '');
  const [tin, setTin] = useState(profile.compliance.tin ?? '');
  const [pensionPFA, setPensionPFA] = useState(profile.compliance.pensionPFA ?? '');
  const [pensionNumber, setPensionNumber] = useState(profile.compliance.pensionNumber ?? '');
  const [nhfNumber, setNhfNumber] = useState(profile.compliance.nhfNumber ?? '');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      firstName, lastName,
      phone: phone || null,
      jobTitle,
      grade: grade || null,
      branch: branch || null,
      status,
      nin: nin || null,
      bvn: bvn || null,
      tin: tin || null,
      pensionPFA: pensionPFA || null,
      pensionNumber: pensionNumber || null,
      nhfNumber: nhfNumber || null,
    });
  };

  return (
    <form onSubmit={handle} className="space-y-6 animate-in">
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Editing</div>
        <h3 className="text-[15px] font-bold text-slate-900">{profile.name}</h3>
      </div>

      <Section icon={Briefcase} title="Identity">
        <TextField label="First Name" value={firstName} onChange={setFirstName} required />
        <TextField label="Last Name" value={lastName} onChange={setLastName} required />
        <TextField label="Job Title" value={jobTitle} onChange={setJobTitle} required />
        <TextField label="Grade" value={grade} onChange={setGrade} />
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <TextField label="Branch / Hub" value={branch} onChange={setBranch} />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </Section>

      <Section icon={ShieldCheck} title="Compliance">
        <TextField label="NIN" value={nin} onChange={setNin} />
        <TextField label="BVN" value={bvn} onChange={setBvn} />
        <TextField label="TIN" value={tin} onChange={setTin} />
        <TextField label="Pension PFA" value={pensionPFA} onChange={setPensionPFA} />
        <TextField label="Pension Number" value={pensionNumber} onChange={setPensionNumber} />
        <TextField label="NHF Number" value={nhfNumber} onChange={setNhfNumber} />
      </Section>

      {error && <Alert tone="rose" message={error} />}
      {success && <Alert tone="emerald" message={success} />}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── Request form (employee self-service path) ───────────────────────────────

function RequestForm({
  profile, onCancel, onSubmit, busy, error, success,
}: {
  profile: ProfilePayload;
  onCancel: () => void;
  onSubmit: (input: { field: string; proposedValue: string | null; reason: string }) => Promise<void>;
  busy: boolean;
  error: string | null;
  success: string | null;
}) {
  const [field, setField] = useState('jobTitle');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ field, proposedValue: proposedValue || null, reason });
  };

  return (
    <form onSubmit={handle} className="space-y-5 animate-in">
      <div className="space-y-1">
        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Profile Change Request</div>
        <h3 className="text-[15px] font-bold text-slate-900">{profile.name}</h3>
        <p className="text-[12px] text-slate-500 mt-1">
          HR will review your request and apply the change. You&apos;ll see it reflected in your profile once approved.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field to Change</label>
        <select
          aria-label="Field to change"
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
        >
          <option value="firstName">First Name</option>
          <option value="lastName">Last Name</option>
          <option value="jobTitle">Job Title</option>
          <option value="grade">Grade</option>
          <option value="branch">Branch / Hub</option>
          <option value="nin">NIN</option>
          <option value="bvn">BVN</option>
          <option value="tin">TIN</option>
          <option value="pensionPFA">Pension PFA</option>
          <option value="pensionNumber">Pension Number</option>
          <option value="nhfNumber">NHF Number</option>
        </select>
      </div>

      <TextField label="Proposed Value (optional)" value={proposedValue} onChange={setProposedValue} />

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason (required)</label>
        <textarea
          aria-label="Reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Explain why this needs changing — e.g. legal name update, correction of typo, etc."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-indigo-500"
        />
      </div>

      {error && <Alert tone="rose" message={error} />}
      {success && <Alert tone="emerald" message={success} />}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
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
  );
}

// ─── shared atoms ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-[13px] font-bold text-slate-900 break-words">{value}</div>
    </div>
  );
}

function TextField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
      <input
        aria-label={label}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : status === 'INACTIVE' ? 'bg-slate-100 text-slate-600 border-slate-200'
    : 'bg-rose-50 text-rose-700 border-rose-100';
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${tone}`}>
      {status}
    </span>
  );
}

function Alert({ tone, message }: { tone: 'rose' | 'emerald'; message: string }) {
  const palette = tone === 'rose'
    ? { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', icon: 'text-rose-500' }
    : { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' };
  const Icon = tone === 'rose' ? AlertTriangle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2 p-3 ${palette.bg} border ${palette.border} rounded-xl`}>
      <Icon className={`w-4 h-4 ${palette.icon} mt-0.5 shrink-0`} />
      <span className={`text-[12px] font-medium ${palette.text} leading-relaxed`}>{message}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function formatNGN(n: number): string {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

// ─── Banking section ─────────────────────────────────────────────────────────
//
// Bank details feed the NIBSS-style disbursement CSV at PROCESS time —
// employees with no account on file are silently skipped by payroll.
// Self-service is enabled (SELF_SERVICEABLE on the API side) so a new
// hire can set their own bank info without HR being a bottleneck. HR
// and anyone with payroll:edit can also write here.

function BankingSection({ profile }: { profile: ProfilePayload }) {
  const editable = profile.capabilities.canEditBanking || profile.capabilities.canEditSelf;
  const [editing, setEditing] = useState(false);
  const [bankName,   setBankName]   = useState(profile.banking.bankName ?? '');
  const [bankCode,   setBankCode]   = useState(profile.banking.bankCode ?? '');
  const [account,    setAccount]    = useState(profile.banking.bankAccountNumber ?? '');
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (editing) return;
    setBankName(profile.banking.bankName ?? '');
    setBankCode(profile.banking.bankCode ?? '');
    setAccount(profile.banking.bankAccountNumber ?? '');
  }, [editing, profile.banking.bankName, profile.banking.bankCode, profile.banking.bankAccountNumber]);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/employees/${profile.id}/profile`, 'PATCH', {
        bankName:          bankName  || null,
        bankCode:          bankCode  || null,
        bankAccountNumber: account   || null,
      });
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save bank details');
    } finally {
      setBusy(false);
    }
  };

  const hasAccount = !!profile.banking.bankAccountNumber;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Bank Account</h4>
          {!profile.capabilities.canViewBanking && (
            <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded border border-amber-100">
              Masked
            </span>
          )}
        </div>
        {editable && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            <Edit3 className="w-3 h-3" />
            {hasAccount ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {!editing ? (
        hasAccount ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">On file</div>
              <div className="text-[13px] font-bold text-slate-900 mt-1">
                {profile.banking.bankName ?? '—'} · {profile.banking.bankAccountNumber}
              </div>
              {profile.banking.bankCode && (
                <div className="text-[10px] text-slate-500 mt-0.5">NIBSS code {profile.banking.bankCode}</div>
              )}
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Missing</div>
              <div className="text-[12px] text-rose-700 mt-1 leading-snug">
                No bank account on file — payroll disbursement will skip this employee.
              </div>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
        )
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Bank Name" value={bankName} onChange={setBankName} />
            <TextField label="NIBSS Code" value={bankCode} onChange={setBankCode} />
          </div>
          <TextField label="Account Number (10 digits)" value={account} onChange={setAccount} />
          {error && <Alert tone="rose" message={error} />}
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
              className="flex-1 h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3 h-3" />
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {savedFlash && <Alert tone="emerald" message="Bank details saved." />}
    </div>
  );
}

// ─── Compensation section ────────────────────────────────────────────────────
//
// Read-only summary of the active SalaryStructure. Salary structure CRUD
// lives at /payroll/salary-structures — this is just the at-a-glance
// view so HR / managers don't have to navigate away to see comp.

function CompensationSection({
  compensation,
}: {
  compensation: ProfilePayload['compensation'];
}) {
  if (!compensation) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Compensation</h4>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[12px] text-amber-700">
            No active salary structure. Payroll runs will skip this employee until one is created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Compensation</h4>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Effective {formatDate(compensation.effectiveDate)}
        </span>
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <KV label="Basic"     value={formatNGN(compensation.basicSalary)} />
          <KV label="Housing"   value={formatNGN(compensation.housingAllowance)} />
          <KV label="Transport" value={formatNGN(compensation.transportAllowance)} />
        </div>
        {compensation.otherAllowances > 0 && (
          <div className="pt-3 border-t border-indigo-100">
            <KV label="Other Allowances" value={formatNGN(compensation.otherAllowances)} />
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Gross Monthly</span>
          <span className="text-xl font-black text-indigo-700">{formatNGN(compensation.grossMonthly)}</span>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
      <div className="text-[12px] font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

// ─── Documents section ───────────────────────────────────────────────────────

interface DocRow {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
}

const KIND_LABEL: Record<string, string> = {
  RESUME:      'Resume / CV',
  CERTIFICATE: 'Certificate',
  ID_CARD:     'ID Card',
  CONTRACT:    'Contract',
  TAX_DOC:     'Tax Document',
  OTHER:       'Other',
};

function DocumentsSection({ employeeId, canManage }: { employeeId: string; canManage: boolean }) {
  const { data: docs = [], refresh } = useApi<DocRow[]>(
    `/api/employees/${employeeId}/documents`,
    { pollMs: false },
  );

  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Documents
            <span className="ml-2 text-slate-300">{docs.length > 0 ? `(${docs.length})` : ''}</span>
          </h4>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            <Upload className="w-3 h-3" />
            {showUpload ? 'Close' : 'Upload'}
          </button>
        )}
      </div>

      {showUpload && canManage && (
        <UploadForm
          employeeId={employeeId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); refresh(); }}
        />
      )}

      {docs.length === 0 ? (
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl text-center text-[12px] text-slate-500">
          No documents on file yet.
          {canManage && ' Click Upload to add a resume, certificate, contract, etc.'}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <DocumentRow
              key={d.id}
              employeeId={employeeId}
              doc={d}
              canManage={canManage}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  employeeId, doc, canManage, onDeleted,
}: {
  employeeId: string;
  doc: DocRow;
  canManage: boolean;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiMutate(`/api/employees/${employeeId}/documents/${doc.id}`, 'DELETE');
      onDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete document');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-slate-900 truncate">{doc.fileName}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-widest shrink-0">
            {KIND_LABEL[doc.kind] ?? doc.kind}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {formatFileSize(doc.sizeBytes)} · uploaded by {doc.uploadedBy.name} · {formatDate(doc.createdAt)}
        </div>
        {doc.description && (
          <div className="text-[11px] text-slate-500 mt-1 italic">{doc.description}</div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={`/api/employees/${employeeId}/documents/${doc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Download ${doc.fileName}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        {canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${doc.fileName}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function UploadForm({
  employeeId, onClose, onUploaded,
}: {
  employeeId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [kind, setKind] = useState('RESUME');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Pick a file first.');
      return;
    }
    setError(null);
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    if (description) fd.append('description', description);
    try {
      const res = await fetch(`/api/employees/${employeeId}/documents`, {
        method: 'POST',
        body:   fd,
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error?.message ?? json?.message ?? `HTTP ${res.status}`);
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
          <select
            aria-label="Document type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-[12px] font-bold outline-none focus:border-indigo-500"
          >
            {Object.entries(KIND_LABEL).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">File (max 4 MB)</label>
          <input
            type="file"
            aria-label="File"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-2 text-[11px] outline-none focus:border-indigo-500 file:mr-2 file:h-7 file:rounded file:border-0 file:bg-slate-900 file:text-white file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:cursor-pointer"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description (optional)</label>
        <input
          type="text"
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 2024 NIBSS certification"
          className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-[12px] outline-none focus:border-indigo-500"
        />
      </div>
      {error && <Alert tone="rose" message={error} />}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex-1 h-9 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !file}
          className="flex-1 h-9 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
