'use client';

import React, { useRef, useState } from 'react';
import { Bell, MessageSquare, Volume2, Mail, Palette, KeyRound, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { usePreferences, ThemePref, EmailDigestPref } from '@/context/PreferencesContext';
import { apiMutate } from '@/lib/api/fetcher';

/** Brief inline "Saved" indicator that fades out. Bypasses ToastContext so it
 *  still appears even if the user has muted toasts in this same screen. */
function useSavedFlash(): { savedKey: string | null; flash: (key: string) => void } {
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (key: string) => {
    setSavedKey(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSavedKey(null), 1500);
  };
  return { savedKey, flash };
}

function SavedTick({ visible }: { visible: boolean }) {
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <CheckCircle2 className="w-3 h-3" /> Saved
    </span>
  );
}

/**
 * Personal preferences — distinct from /settings (which is admin-only
 * system control). Every signed-in user owns this page; SUPER_ADMIN does
 * NOT see different content here.
 *
 * Sections:
 *   - Appearance — theme (light / dark / system)
 *   - Messaging notifications — unread badge, toasts, sounds
 *   - Email digest cadence
 *   - Security — change password (current + new with strength rules)
 */

export default function PreferencesPage() {
  const { prefs, setPref, resetAll, ready } = usePreferences();
  const { savedKey, flash } = useSavedFlash();
  const [resetTick, setResetTick] = useState(false);

  function setAndFlash<K extends keyof typeof prefs>(key: K, value: typeof prefs[K]) {
    setPref(key, value);
    flash(String(key));
  }
  function handleReset() {
    resetAll();
    setResetTick(true);
    setTimeout(() => setResetTick(false), 2000);
  }

  if (!ready) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-slate-100 rounded-[20px]" />
          <div className="h-64 bg-slate-100 rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Preferences</h1>
          <p className="text-[14px] text-slate-500 mt-2 max-w-xl">
            Tailor your view of Suler EMS. Changes apply only to your account on this device — administrators
            don&apos;t see them.
          </p>
        </div>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <RowGroup label="Theme" tick={<SavedTick visible={savedKey === 'theme'} />}>
            <Segmented<ThemePref>
              value={prefs.theme}
              onChange={(v) => setAndFlash('theme', v)}
              options={[
                { value: 'light',  label: 'Light' },
                { value: 'dark',   label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </RowGroup>
        </Section>

        {/* Messaging notifications */}
        <Section icon={MessageSquare} title="Messaging Notifications">
          <ToggleRow
            icon={Bell}
            title="Unread badge counter"
            description="Show a red counter on the messages icon in the header."
            checked={prefs.messageBadge}
            onChange={(v) => setAndFlash('messageBadge', v)}
            tick={<SavedTick visible={savedKey === 'messageBadge'} />}
          />
          <ToggleRow
            icon={MessageSquare}
            title="Toast notifications"
            description="Pop-up confirmations for actions like sent messages, saved settings, and broadcasts."
            checked={prefs.toastsEnabled}
            onChange={(v) => setAndFlash('toastsEnabled', v)}
            tick={<SavedTick visible={savedKey === 'toastsEnabled'} />}
          />
          <ToggleRow
            icon={Volume2}
            title="Broadcast sounds"
            description="Play a soft tone when an organization-wide broadcast arrives."
            checked={prefs.broadcastSounds}
            onChange={(v) => setAndFlash('broadcastSounds', v)}
            tick={<SavedTick visible={savedKey === 'broadcastSounds'} />}
          />
        </Section>

        {/* Email digest */}
        <Section icon={Mail} title="Email Digest">
          <RowGroup label="Send me a summary email" tick={<SavedTick visible={savedKey === 'emailDigest'} />}>
            <Segmented<EmailDigestPref>
              value={prefs.emailDigest}
              onChange={(v) => setAndFlash('emailDigest', v)}
              options={[
                { value: 'off',    label: 'Off' },
                { value: 'daily',  label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
              ]}
            />
          </RowGroup>
          <p className="text-[11px] text-slate-400 mt-1.5 px-1">
            Email delivery is queued through the next pilot release; your choice is recorded now.
          </p>
        </Section>

        {/* Security */}
        <Section icon={KeyRound} title="Security">
          <PasswordChangeForm />
        </Section>

        {/* Reset */}
        <div className="flex items-center justify-end gap-3">
          {resetTick && (
            <span aria-live="polite" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reset to defaults
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset preferences to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function RowGroup({ label, children, tick }: { label: string; children: React.ReactNode; tick?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <p className="text-[12px] font-bold text-slate-700">{label}</p>
        {tick}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange, tick }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tick?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-slate-900">{title}</p>
          {tick}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

interface SegmentedOption<T extends string> { value: T; label: string }
function Segmented<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <div className="inline-flex bg-slate-100 rounded-[10px] p-0.5 gap-0.5">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={Boolean(active)}
            className={`h-8 px-3 rounded-[8px] text-[11px] font-bold uppercase tracking-widest transition-colors ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PasswordChangeForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const newOk = next.length >= 10 && /[A-Z]/.test(next) && /[a-z]/.test(next) && /[0-9]/.test(next);
  const matches = next.length > 0 && next === confirm;
  const canSubmit = !!current && newOk && matches && !saving;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!canSubmit) return;
    setSaving(true);
    try {
      const r = await apiMutate<{ currentPassword: string; newPassword: string }, { ok: boolean; message: string }>(
        '/api/profile/password', 'PATCH',
        { currentPassword: current, newPassword: next },
      );
      setSuccess(r.message);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-[12px] text-slate-500">
        Update the password you use to sign in. Your other sessions will be signed out automatically
        after this change.
      </p>

      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="pw-current">Current password</label>
        <input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="mt-1.5 w-full h-10 px-3 rounded-[10px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="pw-new">New password</label>
          <input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={`mt-1.5 w-full h-10 px-3 rounded-[10px] border text-[13px] text-slate-900 bg-white focus:outline-none ${next && !newOk ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'}`}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="pw-confirm">Confirm new</label>
          <input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`mt-1.5 w-full h-10 px-3 rounded-[10px] border text-[13px] text-slate-900 bg-white focus:outline-none ${confirm && !matches ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'}`}
          />
        </div>
      </div>

      <ul className="text-[11px] text-slate-500 leading-relaxed list-disc pl-5">
        <li className={next.length >= 10 ? 'text-emerald-700' : ''}>At least 10 characters</li>
        <li className={/[A-Z]/.test(next) && /[a-z]/.test(next) ? 'text-emerald-700' : ''}>Mix of upper and lower case</li>
        <li className={/[0-9]/.test(next) ? 'text-emerald-700' : ''}>At least one digit</li>
        <li className={matches ? 'text-emerald-700' : ''}>Confirmation matches</li>
      </ul>

      {error && (
        <div className="px-3 py-2.5 rounded-[10px] bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-widest"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
