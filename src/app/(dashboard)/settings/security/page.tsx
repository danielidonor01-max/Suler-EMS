"use client";

import React, { useState } from 'react';
import {
  Shield, Lock, Clock, AlertTriangle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { RouteGuard } from '@/components/common/RouteGuard';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';

interface Setting {
  key:        string;
  category:   string;
  description: string;
  value:      unknown;
  isDefault:  boolean;
  updatedAt:  string | null;
  updatedBy:  { id: string; name: string; email: string } | null;
}

const PASSWORD_SECTION = [
  'security.password.minLength',
  'security.password.requireUppercase',
  'security.password.requireLowercase',
  'security.password.requireNumbers',
  'security.password.requireSymbols',
];

const SESSION_SECTION = [
  'security.session.idleTimeoutMinutes',
  'security.session.warnBeforeMinutes',
];

const LOCKOUT_SECTION = [
  'security.lockout.maxAttempts',
  'security.lockout.windowMinutes',
  'security.lockout.durationMinutes',
];

const LABELS: Record<string, string> = {
  'security.password.minLength':           'Minimum length',
  'security.password.requireUppercase':    'Require uppercase letter',
  'security.password.requireLowercase':    'Require lowercase letter',
  'security.password.requireNumbers':      'Require digit',
  'security.password.requireSymbols':      'Require special character',
  'security.session.idleTimeoutMinutes':   'Idle timeout',
  'security.session.warnBeforeMinutes':    'Warn before timeout',
  'security.lockout.maxAttempts':          'Failed attempts to lockout',
  'security.lockout.windowMinutes':        'Counting window',
  'security.lockout.durationMinutes':      'Lockout duration',
};

const UNITS: Record<string, string> = {
  'security.password.minLength':         'characters',
  'security.session.idleTimeoutMinutes': 'minutes',
  'security.session.warnBeforeMinutes':  'minutes',
  'security.lockout.maxAttempts':        'attempts',
  'security.lockout.windowMinutes':      'minutes',
  'security.lockout.durationMinutes':    'minutes',
};

export default function SecurityPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <SecurityInner />
    </RouteGuard>
  );
}

function SecurityInner() {
  const { data: settings = [], refresh } = useApi<Setting[]>(
    '/api/settings?category=SECURITY',
    { pollMs: 60_000 },
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const byKey: Record<string, Setting | undefined> = Object.fromEntries(
    settings.map(s => [s.key, s]),
  );

  const updateSetting = async (key: string, value: unknown) => {
    setBusy(key);
    setError(null);
    setFlash(null);
    try {
      await apiMutate(`/api/settings/${encodeURIComponent(key)}`, 'PATCH', { value });
      await refresh();
      setFlash(`${LABELS[key] ?? key} updated.`);
    } catch (err: any) {
      setError(err?.message ?? 'Update failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="section-breathing max-w-[1200px] mx-auto animate-in space-y-10">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Security Policy
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
          Security &amp; Authentication
        </h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[560px]">
          Policies set here are enforced server-side. Password complexity applies at the next password change;
          session timeout applies after a 30-second cache window on every server.
        </p>
      </div>

      {flash && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-emerald-700">{flash}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{error}</span>
        </div>
      )}

      {/* ── Password section ──────────────────────────────────────────────── */}
      <PolicySection
        icon={Lock}
        title="Password Policy"
        description="Applied the next time any user changes their password — current passwords aren't re-validated."
        keys={PASSWORD_SECTION}
        settings={byKey}
        onChange={updateSetting}
        busyKey={busy}
      />

      {/* ── Session section ───────────────────────────────────────────────── */}
      <PolicySection
        icon={Clock}
        title="Session Management"
        description="Idle users see a warning, then are signed out automatically. Lower the timeout for higher-trust environments."
        keys={SESSION_SECTION}
        settings={byKey}
        onChange={updateSetting}
        busyKey={busy}
      />

      {/* ── Lockout section ───────────────────────────────────────────────── */}
      <PolicySection
        icon={Shield}
        title="Failed Sign-In Lockout"
        description="Repeated failed sign-ins within the counting window lock the account for the lockout duration. Lockout state is derived from LoginAttempt history — no manual unlock action; the timer clears it."
        keys={LOCKOUT_SECTION}
        settings={byKey}
        onChange={updateSetting}
        busyKey={busy}
      />

    </div>
  );
}

// ─── Section + row components ───────────────────────────────────────────────

function PolicySection({
  icon: Icon, title, description, keys, settings, onChange, busyKey,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  keys: string[];
  settings: Record<string, Setting | undefined>;
  onChange: (key: string, value: unknown) => Promise<void> | void;
  busyKey: string | null;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {keys.map(key => {
          const setting = settings[key];
          if (!setting) {
            return (
              <div key={key} className="px-6 py-3 text-[12px] text-slate-400">
                {LABELS[key] ?? key} — loading…
              </div>
            );
          }
          return (
            <SettingRow
              key={key}
              setting={setting}
              onChange={(value) => onChange(setting.key, value)}
              busy={busyKey === setting.key}
            />
          );
        })}
      </div>
    </div>
  );
}

function SettingRow({
  setting, onChange, busy,
}: {
  setting: Setting;
  onChange: (value: unknown) => void;
  busy: boolean;
}) {
  const label = LABELS[setting.key] ?? setting.key;
  const unit  = UNITS[setting.key];
  const lastTouched =
    setting.isDefault ? 'Default'
    : setting.updatedBy ? `by ${setting.updatedBy.name}` : 'Modified';

  if (typeof setting.value === 'boolean') {
    return (
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-slate-900">{label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{setting.description}</div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
          {lastTouched}
        </span>
        <Toggle
          checked={setting.value}
          onChange={(next) => onChange(next)}
          busy={busy}
        />
      </div>
    );
  }

  // Numeric (clamped server-side).
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-slate-900">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{setting.description}</div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
        {lastTouched}
      </span>
      <NumberStepper
        value={setting.value as number}
        onChange={(next) => onChange(next)}
        unit={unit}
        busy={busy}
      />
    </div>
  );
}

function Toggle({
  checked, onChange, busy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Toggle"
      onClick={() => onChange(!checked)}
      disabled={busy}
      className={`relative w-12 h-6 rounded-full transition-all disabled:opacity-60 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
          checked ? 'left-6' : 'left-0.5'
        }`}
      />
      {busy && (
        <RefreshCw className="absolute right-1 top-1 w-4 h-4 text-white animate-spin" />
      )}
    </button>
  );
}

function NumberStepper({
  value, onChange, unit, busy,
}: {
  value: number;
  onChange: (next: number) => void;
  unit?: string;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shrink-0">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={busy}
        aria-label="Decrease"
        className="w-7 h-7 rounded-lg hover:bg-white text-slate-600 font-bold text-lg flex items-center justify-center disabled:opacity-50"
      >
        −
      </button>
      <span className="text-[13px] font-bold text-slate-900 min-w-[40px] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={busy}
        aria-label="Increase"
        className="w-7 h-7 rounded-lg hover:bg-white text-slate-600 font-bold text-lg flex items-center justify-center disabled:opacity-50"
      >
        +
      </button>
      {unit && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-2">{unit}</span>}
    </div>
  );
}
