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
  Calendar, Clock, Activity,
  Target, TrendingUp,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { Select } from '@/components/forms/Select';
import { useEmployeeProfile } from '@/context/EmployeeProfileContext';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/ToastContext';

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
    id:                 string;
    isActive:           boolean;
    effectiveDate:      string;
    basicSalary:        number;
    housingAllowance:   number;
    transportAllowance: number;
    otherAllowances:    number;
    grossMonthly:       number;
    currency:           string;
    reason:             string | null;
    history: Array<{
      id:                 string;
      isActive:           boolean;
      effectiveDate:      string;
      basicSalary:        number;
      housingAllowance:   number;
      transportAllowance: number;
      otherAllowances:    number;
      grossMonthly:       number;
      currency:           string;
      reason:             string | null;
    }>;
  } | null;

  leaveBalances: Array<{
    typeCode:  string;
    typeName:  string;
    color:     string | null;
    quota:     number;
    used:      number;
    remaining: number;
  }>;

  attendanceSummary: {
    windowDays:     number;
    present:        number;
    late:           number;
    absent:         number;
    totalLogged:    number;
    punctualityPct: number;
    lastCheckIn:    string | null;
    lastCheckOut:   string | null;
    lastStatus:     string | null;
  };

  pendingChangeRequests: Array<{
    id:            string;
    field:         string;
    currentValue:  string | null;
    proposedValue: string | null;
    reason:        string;
    createdAt:     string;
    requestedBy:   { id: string; name: string };
  }>;

  orgChart: {
    reportsTo: Array<{
      id:           string;
      staffId:      string;
      firstName:    string;
      lastName:     string;
      jobTitle:     string;
      relationship: string;
    }>;
    directReports: Array<{
      id:           string;
      staffId:      string;
      firstName:    string;
      lastName:     string;
      jobTitle:     string;
      relationship: string;
    }>;
    directReportsTotal: number;
  };

  recentPayslips: Array<{
    id:              string;
    period:          string;
    runName:         string;
    processedAt:     string | null;
    grossPay:        number;
    paye:            number;
    totalDeductions: number;
    netPay:          number;
  }>;

  activityTimeline: Array<{
    id:           string;
    kind:         'CHANGE_REQUEST_CREATED' | 'CHANGE_REQUEST_REVIEWED'
                | 'SALARY_STRUCTURE_CREATED'
                | 'DOCUMENT_UPLOADED'
                | 'LEAVE_REQUEST_CREATED';
    title:        string;
    description:  string;
    actorName:    string | null;
    timestamp:    string;
    resourceId:   string;
    resourceType: string;
  }>;

  performanceSummary: {
    goals: {
      active:    number;
      completed: number;
      overdue:   number;
      topOpen:   Array<{
        id:              string;
        title:           string;
        progressPercent: number;
        category:        string;
        dueDate:         string | null;
        isOverdue:       boolean;
      }>;
    };
    kpis: {
      total:  number;
      atRisk: Array<{
        id:             string;
        title:          string;
        target:         number;
        unit:           string | null;
        frequency:      string;
        latestValue:    number | null;
        achievementPct: number;
      }>;
    };
  };

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

  // Tenure: years + months since createdAt. We deliberately use the
  // employee.createdAt, not user.createdAt — the employee record is the
  // hire date; the user row may have been created later (or not at all
  // for non-system staff).
  const tenure = useMemo(() => {
    const start = new Date(profile.createdAt);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) return 'just hired';
    if (years === 0 && months === 0) return 'this month';
    if (years === 0) return `${months}mo`;
    if (months === 0) return `${years}yr`;
    return `${years}yr ${months}mo`;
  }, [profile.createdAt]);

  const lastLogin = profile.user?.lastLoginAt;
  const lastLoginLabel = lastLogin
    ? formatRelativeShort(lastLogin)
    : null;

  return (
    <div className="space-y-6 animate-in">
      {/* Identity header */}
      <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[18px] font-black shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">{profile.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[12px] font-bold text-slate-500">{profile.jobTitle}</span>
            <StatusPill status={profile.status} />
            {profile.department && (
              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded">
                {profile.department.name}{profile.hub ? ` · ${profile.hub.name}` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{profile.email}</span>
            {profile.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{profile.phone}</span>}
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {profile.staffId}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Briefcase className="w-3 h-3" />
              {tenure}
            </span>
            {/* Last login is HR-only — too noisy to surface on every
                profile view, and self-view doesn't need it either. */}
            {profile.capabilities.canEdit && lastLoginLabel && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3 h-3" />
                Last seen {lastLoginLabel}
              </span>
            )}
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

      {/* Pending change requests — shown up top because they describe the
          actual *state* of this profile (what's about to change). HR
          should see them before reading the current values. */}
      {profile.pendingChangeRequests.length > 0 && (
        <PendingChangeRequestsSection
          requests={profile.pendingChangeRequests}
          isOwner={profile.capabilities.canEditSelf}
          isHR={profile.capabilities.canEdit}
        />
      )}

      {/* Org chart — reports-to + direct reports. Renders only when at
          least one relationship is known. Chips call into the global
          EmployeeProfileContext directly, same as EmployeeChip. */}
      {(profile.orgChart.reportsTo.length > 0 || profile.orgChart.directReports.length > 0) && (
        <OrgChartSection orgChart={profile.orgChart} />
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

      {/* Recent payslips — only when there are any. Same gating as
          Compensation; the API returns an empty array for non-privileged
          viewers, so the section just collapses for them. */}
      {profile.capabilities.canViewCompensation && profile.recentPayslips.length > 0 && (
        <RecentPayslipsSection payslips={profile.recentPayslips} />
      )}

      {/* Leave balances + attendance summary — paired since they're both
          year-to-date / trailing-window snapshots of the same person. */}
      <LeaveBalanceSection balances={profile.leaveBalances} />
      <AttendanceSummarySection summary={profile.attendanceSummary} />

      {/* Performance + KPI strip */}
      <PerformanceStripSection summary={profile.performanceSummary} />

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

      {/* Activity timeline — last 20 events that touched this profile.
          Empty array when caller isn't HR/owner, so the section
          collapses without a permissions check here. */}
      {profile.activityTimeline.length > 0 && (
        <ActivityTimelineSection events={profile.activityTimeline} />
      )}
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
        <Select
          label="Status"
          value={status}
          onChange={(val) => setStatus(val as any)}
          options={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
            { label: 'Suspended', value: 'SUSPENDED' }
          ]}
        />
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

      <Select
        label="Field to Change"
        value={field}
        onChange={setField}
        options={[
          { label: 'First Name', value: 'firstName' },
          { label: 'Last Name', value: 'lastName' },
          { label: 'Job Title', value: 'jobTitle' },
          { label: 'Grade', value: 'grade' },
          { label: 'Branch / Hub', value: 'branch' },
          { label: 'NIN', value: 'nin' },
          { label: 'BVN', value: 'bvn' },
          { label: 'TIN', value: 'tin' },
          { label: 'Pension PFA', value: 'pensionPFA' },
          { label: 'Pension Number', value: 'pensionNumber' },
          { label: 'NHF Number', value: 'nhfNumber' }
        ]}
      />

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

  const [showHistory, setShowHistory] = useState(false);
  const hasHistory = compensation.history.length > 0;

  // Previous active gross for the change indicator. History is sorted
  // most-recent first, so [0] is the structure right before the current
  // one.
  const previousGross = hasHistory ? compensation.history[0].grossMonthly : null;
  const delta = previousGross != null ? compensation.grossMonthly - previousGross : null;

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
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-indigo-700">{formatNGN(compensation.grossMonthly)}</span>
            {delta != null && delta !== 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                delta > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {delta > 0 ? '+' : ''}{formatNGN(Math.abs(delta))}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasHistory && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              Compensation history ({compensation.history.length})
            </span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="bg-white divide-y divide-slate-100">
              {compensation.history.map(h => (
                <div key={h.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-700">{formatDate(h.effectiveDate)}</div>
                    {h.reason && (
                      <div className="text-[10px] text-slate-500 italic truncate mt-0.5">{h.reason}</div>
                    )}
                  </div>
                  <div className="text-[12px] font-bold text-slate-900 whitespace-nowrap">
                    {formatNGN(h.grossMonthly)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

// ─── Leave-balance palette ──────────────────────────────────────────────────
// Same token convention as /leave/admin uses: API returns a colour name,
// we resolve to tailwind classes here. Unknown tokens fall back to slate.
const BALANCE_PALETTE: Record<string, { text: string; bar: string; bg: string; border: string }> = {
  indigo:  { text: 'text-indigo-700',  bar: 'bg-indigo-500',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  rose:    { text: 'text-rose-700',    bar: 'bg-rose-500',    bg: 'bg-rose-50',    border: 'border-rose-100' },
  amber:   { text: 'text-amber-700',   bar: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  pink:    { text: 'text-pink-700',    bar: 'bg-pink-500',    bg: 'bg-pink-50',    border: 'border-pink-100' },
  sky:     { text: 'text-sky-700',     bar: 'bg-sky-500',     bg: 'bg-sky-50',     border: 'border-sky-100' },
  emerald: { text: 'text-emerald-700', bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  slate:   { text: 'text-slate-700',   bar: 'bg-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200' },
};
function balancePalette(token: string | null | undefined) {
  return BALANCE_PALETTE[token ?? 'slate'] ?? BALANCE_PALETTE.slate;
}

// ─── Leave balance section ──────────────────────────────────────────────────

function LeaveBalanceSection({
  balances,
}: {
  balances: ProfilePayload['leaveBalances'];
}) {
  if (balances.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Leave Balance — Year to Date</h4>
        </div>
        <div className="text-[12px] text-slate-400 italic">No leave types configured yet.</div>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Leave Balance — {year}</h4>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {balances.map(b => {
          const palette = balancePalette(b.color);
          const pct = b.quota > 0 ? Math.min(100, (b.used / b.quota) * 100) : 0;
          return (
            <div key={b.typeCode} className={`p-3 rounded-xl border ${palette.bg} ${palette.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-widest ${palette.text}`}>{b.typeName}</span>
                <span className="text-[11px] font-bold text-slate-600">{b.used} / {b.quota}</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden border border-white">
                <div
                  className={`h-full rounded-full ${palette.bar} transition-all duration-700`}
                  ref={(el) => { if (el) el.style.width = `${pct}%`; }}
                />
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-2">{b.remaining} day{b.remaining === 1 ? '' : 's'} remaining</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Attendance summary section ─────────────────────────────────────────────

function AttendanceSummarySection({
  summary,
}: {
  summary: ProfilePayload['attendanceSummary'];
}) {
  const punctualityTone =
    summary.totalLogged === 0    ? 'text-slate-400'
    : summary.punctualityPct >= 90 ? 'text-emerald-700'
    : summary.punctualityPct >= 75 ? 'text-amber-700'
    : 'text-rose-700';

  const punctualityBg =
    summary.totalLogged === 0    ? 'bg-slate-50 border-slate-200'
    : summary.punctualityPct >= 90 ? 'bg-emerald-50 border-emerald-100'
    : summary.punctualityPct >= 75 ? 'bg-amber-50 border-amber-100'
    : 'bg-rose-50 border-rose-100';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Attendance — Last {summary.windowDays} Days</h4>
        </div>
      </div>

      {summary.totalLogged === 0 ? (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-500 italic">
          No clock-ins in the last {summary.windowDays} days.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <AttendanceTile label="Present" value={summary.present} tone="emerald" icon={CheckCircle2} />
            <AttendanceTile label="Late"    value={summary.late}    tone={summary.late > 0 ? 'amber' : 'slate'} icon={Clock} />
            <AttendanceTile label="Absent"  value={summary.absent}  tone={summary.absent > 0 ? 'rose' : 'slate'} icon={AlertTriangle} />
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${punctualityBg}`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Punctuality</span>
            <span className={`text-[15px] font-black ${punctualityTone}`}>{summary.punctualityPct}%</span>
          </div>

          {summary.lastCheckIn && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Last clock-in: {formatDate(summary.lastCheckIn)}
              {summary.lastCheckOut && ' · clocked out'}
              {summary.lastStatus && ` · ${summary.lastStatus}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttendanceTile({
  label, value, tone, icon: Icon,
}: {
  label: string;
  value: number;
  tone:  'emerald' | 'amber' | 'rose' | 'slate';
  icon:  React.ComponentType<{ className?: string }>;
}) {
  const map: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700',   icon: 'text-amber-500' },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-700',    icon: 'text-rose-500' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700',   icon: 'text-slate-400' },
  };
  const palette = map[tone];
  return (
    <div className={`p-3 rounded-xl border ${palette.bg} ${palette.border} flex items-center justify-between`}>
      <div>
        <div className={`text-[10px] font-bold uppercase tracking-widest ${palette.text}`}>{label}</div>
        <div className={`text-xl font-black ${palette.text} leading-none mt-1`}>{value}</div>
      </div>
      <Icon className={`w-4 h-4 ${palette.icon}`} />
    </div>
  );
}

// ─── Recent payslips ────────────────────────────────────────────────────────
//
// Last 6 PROCESSED payslips for the subject employee. Tone-coded chip on
// the period, link to download the PDF (existing /api/payroll/me/payslip
// route handles authorization — same rules as the API gating for this
// section). Pay-trend indicator on the most recent row shows whether
// net moved up or down vs the prior month.

function RecentPayslipsSection({
  payslips,
}: {
  payslips: ProfilePayload['recentPayslips'];
}) {
  // Trend = current netPay vs the next-most-recent. Array is sorted
  // newest-first by the API, so [0] is current and [1] is prior.
  const prevNet = payslips[1]?.netPay ?? null;
  const delta   = prevNet != null ? payslips[0].netPay - prevNet : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Payslips</h4>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {payslips.length} processed
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {payslips.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900">{p.period}</div>
              <div className="text-[10px] text-slate-500 truncate">
                Gross {formatNGN(p.grossPay)} · Deductions {formatNGN(p.totalDeductions)}
              </div>
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net</div>
                <div className="text-[13px] font-bold text-slate-900">{formatNGN(p.netPay)}</div>
              </div>
              {i === 0 && delta != null && delta !== 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  delta > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {delta > 0 ? '+' : '−'}{formatNGN(Math.abs(delta))}
                </span>
              )}
              <a
                href={`/api/payroll/me/payslip/${p.id}`}
                aria-label={`Download payslip for ${p.period}`}
                title="Download PDF"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Org chart ───────────────────────────────────────────────────────────────
//
// Reports-to (managers above this person) + direct reports (people they
// manage). Each chip is clickable when the parent passes
// onEmployeeClick, which re-targets the modal at the clicked person.
// Without that callback, chips render as plain non-interactive avatars
// — same surface, no navigation.

function OrgChartSection({
  orgChart,
}: {
  orgChart: ProfilePayload['orgChart'];
}) {
  const { reportsTo, directReports, directReportsTotal } = orgChart;
  const hidden = Math.max(0, directReportsTotal - directReports.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-400" />
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Org Chart</h4>
      </div>

      {reportsTo.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Reports to ({reportsTo.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {reportsTo.map(p => (
              <OrgChip key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {directReports.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Direct reports ({directReportsTotal})
            </div>
            {hidden > 0 && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                +{hidden} more not shown
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {directReports.map(p => (
              <OrgChip key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrgChip({
  person,
}: {
  person: ProfilePayload['orgChart']['directReports'][number];
}) {
  // Re-targets this very modal via the global profile context — same
  // navigation surface EmployeeChip uses, so the experience is
  // consistent across the app.
  const { openProfile } = useEmployeeProfile();
  const initials = `${person.firstName[0] ?? ''}${person.lastName[0] ?? ''}`.toUpperCase();
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <button
      type="button"
      onClick={() => openProfile(person.id)}
      aria-label={`Open ${fullName}'s profile`}
      className="text-left transition-transform hover:-translate-y-px hover:shadow-sm rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
    >
      <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold text-slate-900 truncate">{fullName}</div>
          <div className="text-[10px] text-slate-500 truncate">{person.jobTitle}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
            {person.relationship}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Activity timeline ──────────────────────────────────────────────────────
//
// Last 20 events that touched this profile, merged from five sources:
// profile change requests (created + reviewed), salary structure
// creates, document uploads, and leave submissions. Collapsible —
// closed by default so the timeline doesn't dominate first-paint for
// long-tenure employees.

const KIND_META: Record<
  ProfilePayload['activityTimeline'][number]['kind'],
  { label: string; tone: string; iconBg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CHANGE_REQUEST_CREATED:   { label: 'Change Request',   tone: 'text-amber-700',   iconBg: 'bg-amber-50 border-amber-100',     icon: Send       },
  CHANGE_REQUEST_REVIEWED:  { label: 'Change Reviewed',  tone: 'text-indigo-700',  iconBg: 'bg-indigo-50 border-indigo-100',   icon: CheckCircle2 },
  SALARY_STRUCTURE_CREATED: { label: 'Salary Updated',   tone: 'text-emerald-700', iconBg: 'bg-emerald-50 border-emerald-100', icon: Banknote   },
  DOCUMENT_UPLOADED:        { label: 'Document Added',   tone: 'text-sky-700',     iconBg: 'bg-sky-50 border-sky-100',         icon: Paperclip  },
  LEAVE_REQUEST_CREATED:    { label: 'Leave Requested',  tone: 'text-rose-700',    iconBg: 'bg-rose-50 border-rose-100',       icon: Calendar   },
};

function formatRelativeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)      return 'just now';
  if (mins < 60)     return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)      return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)      return `${days}d ago`;
  return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function ActivityTimelineSection({
  events,
}: {
  events: ProfilePayload['activityTimeline'];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, 5);

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            Activity Timeline
          </span>
          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded border border-slate-200">
            {events.length}
          </span>
        </div>
        {events.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
          >
            {expanded ? 'Show fewer' : `Show all ${events.length}`}
          </button>
        )}
      </div>

      <div className="bg-white">
        <ul className="divide-y divide-slate-50">
          {visible.map(ev => {
            const meta = KIND_META[ev.kind];
            const Icon = meta.icon;
            return (
              <li key={ev.id} className="flex items-start gap-3 p-4">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                  <Icon className={`w-3.5 h-3.5 ${meta.tone}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${meta.tone}`}>
                      {meta.label}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {formatRelativeShort(ev.timestamp)}
                    </div>
                  </div>
                  <div className="text-[12px] font-bold text-slate-900 mt-0.5 truncate">{ev.title}</div>
                  <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{ev.description}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── Pending profile change requests ────────────────────────────────────────
//
// Surfaces in-flight ProfileChangeRequest rows for this employee. HR sees
// the actionable list at the top so a manager opening a profile during
// review prep knows what's about to change (a name correction, an NIN
// update). For the owner, this is a "your pending requests" reminder.
//
// The full HR action surface (approve/reject) lives at
// /admin/profile-requests — this strip just announces and links.

const FIELD_LABEL: Record<string, string> = {
  firstName:     'First Name',
  lastName:      'Last Name',
  phone:         'Phone',
  jobTitle:      'Job Title',
  grade:         'Grade',
  branch:        'Branch',
  nin:           'NIN',
  bvn:           'BVN',
  tin:           'TIN',
  pensionPFA:    'Pension PFA',
  pensionNumber: 'Pension #',
  nhfNumber:     'NHF #',
};

function PendingChangeRequestsSection({
  requests,
  isOwner,
  isHR,
}: {
  requests: ProfilePayload['pendingChangeRequests'];
  isOwner: boolean;
  isHR:    boolean;
}) {
  if (requests.length === 0) return null;
  const headline = isHR
    ? `${requests.length} pending change request${requests.length === 1 ? '' : 's'} — awaiting HR review.`
    : isOwner
      ? `You have ${requests.length} pending change request${requests.length === 1 ? '' : 's'} awaiting HR.`
      : `${requests.length} pending change request${requests.length === 1 ? '' : 's'} on this profile.`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-amber-500" />
          <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-[0.2em]">Pending Changes</h4>
        </div>
        {isHR && (
          <a
            href="/admin/profile-requests"
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
          >
            Review all →
          </a>
        )}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[12px] font-bold text-amber-700">
        {headline}
      </div>

      <div className="space-y-2">
        {requests.map(r => (
          <div key={r.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold text-slate-900">
                {FIELD_LABEL[r.field] ?? r.field}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {formatDate(r.createdAt)} · {r.requestedBy.name}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono truncate max-w-[40%]">
                {r.currentValue ?? '—'}
              </span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-mono font-bold truncate max-w-[40%]">
                {r.proposedValue ?? '(clear)'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 italic leading-snug">{r.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Performance + KPI strip ─────────────────────────────────────────────────
//
// Pulls the active goal headline + KPI achievement at a glance. We're not
// trying to replace the dedicated /performance pages — this is the
// "where's this person?" answer when a manager opens a profile during
// review prep.

function PerformanceStripSection({
  summary,
}: {
  summary: ProfilePayload['performanceSummary'];
}) {
  const { goals, kpis } = summary;
  const hasAny = goals.active + goals.completed + kpis.total > 0;

  if (!hasAny) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" />
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Performance</h4>
        </div>
        <div className="text-[12px] text-slate-400 italic">No active goals or KPIs yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-slate-400" />
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Performance</h4>
      </div>

      {/* Goal counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Active Goals</div>
          <div className="text-xl font-black text-indigo-700 leading-none mt-1">{goals.active}</div>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Completed</div>
          <div className="text-xl font-black text-emerald-700 leading-none mt-1">{goals.completed}</div>
        </div>
        <div className={`p-3 rounded-xl border ${
          goals.overdue > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-[9px] font-bold uppercase tracking-widest ${
            goals.overdue > 0 ? 'text-rose-600' : 'text-slate-500'
          }`}>Overdue</div>
          <div className={`text-xl font-black leading-none mt-1 ${
            goals.overdue > 0 ? 'text-rose-700' : 'text-slate-700'
          }`}>{goals.overdue}</div>
        </div>
      </div>

      {/* Top open goals */}
      {goals.topOpen.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</div>
          {goals.topOpen.map(g => (
            <div key={g.id} className={`p-3 rounded-xl border ${
              g.isOverdue ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[12px] font-bold text-slate-900 truncate">{g.title}</div>
                <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                  {g.progressPercent}%{g.isOverdue && <span className="text-rose-600 ml-1">· overdue</span>}
                </div>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden border border-white">
                <div
                  className={`h-full rounded-full transition-all ${
                    g.isOverdue ? 'bg-rose-500' : g.progressPercent >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  ref={(el) => { if (el) el.style.width = `${g.progressPercent}%`; }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI at-risk */}
      {kpis.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              KPIs ({kpis.total})
            </div>
            {kpis.atRisk.length > 0 && (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lowest first</span>
            )}
          </div>
          <div className="space-y-2">
            {kpis.atRisk.map(k => {
              const onTrack = k.achievementPct >= 100;
              const atRisk  = k.achievementPct < 70;
              return (
                <div key={k.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="text-[12px] font-bold text-slate-900 truncate">{k.title}</div>
                    <div className={`text-[10px] font-bold whitespace-nowrap ${
                      onTrack ? 'text-emerald-700' : atRisk ? 'text-rose-700' : 'text-amber-700'
                    }`}>
                      {k.latestValue == null
                        ? '— / ' + k.target + (k.unit ? ` ${k.unit}` : '')
                        : `${k.latestValue}${k.unit ? ` ${k.unit}` : ''} / ${k.target}${k.unit ? ` ${k.unit}` : ''}`}
                      <span className="ml-1">· {k.achievementPct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden border border-white">
                    <div
                      className={`h-full rounded-full transition-all ${
                        onTrack ? 'bg-emerald-500' : atRisk ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      ref={(el) => { if (el) el.style.width = `${Math.min(100, k.achievementPct)}%`; }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
        <DocumentsGrouped
          docs={docs}
          employeeId={employeeId}
          canManage={canManage}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

/**
 * Group documents by kind so HR scanning for "the contract" doesn't
 * scroll past every CV. Order is intentional — most-asked-for kinds
 * first; anything outside the catalogue lands in OTHER.
 */
const DOC_KIND_ORDER: string[] = ['CONTRACT', 'ID_CARD', 'TAX_DOC', 'CERTIFICATE', 'RESUME', 'OTHER'];

function DocumentsGrouped({
  docs, employeeId, canManage, onChanged,
}: {
  docs: DocRow[];
  employeeId: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const grouped = useMemo(() => {
    const buckets = new Map<string, DocRow[]>();
    for (const d of docs) {
      const k = DOC_KIND_ORDER.includes(d.kind) ? d.kind : 'OTHER';
      const arr = buckets.get(k) ?? [];
      arr.push(d);
      buckets.set(k, arr);
    }
    // Stable order: catalogue order first, then any unrecognized kinds.
    return DOC_KIND_ORDER
      .filter(k => buckets.has(k))
      .map(k => ({ kind: k, items: buckets.get(k)! }));
  }, [docs]);

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.kind} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {KIND_LABEL[group.kind] ?? group.kind}
            </span>
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded">
              {group.items.length}
            </span>
          </div>
          <div className="space-y-2">
            {group.items.map(d => (
              <DocumentRow
                key={d.id}
                employeeId={employeeId}
                doc={d}
                canManage={canManage}
                onDeleted={onChanged}
              />
            ))}
          </div>
        </div>
      ))}
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
  const confirm = useConfirm();
  const { addToast } = useToast();

  const handleDelete = async () => {
    const ok = await confirm({
      title:        `Delete "${doc.fileName}"?`,
      message:      'This cannot be undone.',
      confirmLabel: 'Delete',
      tone:         'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiMutate(`/api/employees/${employeeId}/documents/${doc.id}`, 'DELETE');
      onDeleted();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not delete document', 'ERROR');
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
        <Select
          label="Type"
          value={kind}
          onChange={setKind}
          options={Object.entries(KIND_LABEL).map(([code, label]) => ({ label, value: code }))}
        />
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
