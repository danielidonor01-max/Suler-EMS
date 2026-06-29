'use client';

import React, { useState } from 'react';
import {
  Smartphone, ShieldCheck, ShieldOff, RefreshCw, Copy, CheckCircle2,
  AlertTriangle, KeyRound, Loader2,
} from 'lucide-react';
import { apiMutate } from '@/lib/api/fetcher';
import { Modal } from '@/components/common/Modal';

/**
 * User-facing MFA control panel. Lives on /profile.
 *
 * State machine:
 *   not-enrolled   → "Enable" → /enroll/start  → enrolling (show secret + codes)
 *                                              → /enroll/confirm → enrolled
 *   enrolled       → "Disable"          → /disable
 *                  → "Regenerate codes" → /regenerate-backup-codes
 *
 * The plaintext secret + backup codes are returned by the server ONCE.
 * We render them inline and never re-fetch — the user has to capture
 * them right here.
 */

interface Props {
  enabled:     boolean;
  lastUsedAt:  string | null;
  onChange:    () => void | Promise<void>;
}

interface StartResponse {
  secret:        string;        // raw base32
  secretChunked: string;        // chunked for manual entry
  otpauthUrl:    string;
  backupCodes:   string[];
}

export function MfaPanel({ enabled, lastUsedAt, onChange }: Props) {
  const [enrolling, setEnrolling] = useState<StartResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disablingOpen, setDisablingOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  // ── Enrollment kickoff ───────────────────────────────────────────
  async function startEnrollment() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiMutate<Record<string, never>, StartResponse>(
        '/api/auth/mfa/enroll/start', 'POST', {},
      );
      setEnrolling(res);
      setConfirmCode('');
    } catch (err: any) {
      setError(err?.message ?? 'Could not start enrollment.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrollment() {
    if (!confirmCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/auth/mfa/enroll/confirm', 'POST', { code: confirmCode.trim() });
      setEnrolling(null);
      setConfirmCode('');
      await onChange();
    } catch (err: any) {
      setError(err?.message ?? 'That code didn\'t match. Check your authenticator app.');
    } finally {
      setBusy(false);
    }
  }

  async function disable(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiMutate('/api/auth/mfa/disable', 'POST', { code: code.trim() });
      setDisablingOpen(false);
      await onChange();
    } catch (err: any) {
      setError(err?.message ?? 'Could not disable.');
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiMutate<{ code: string }, { backupCodes: string[] }>(
        '/api/auth/mfa/regenerate-backup-codes', 'POST', { code: code.trim() },
      );
      setFreshCodes(res.backupCodes);
      setRegenerateOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Could not regenerate codes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-slate-400" />
        <div className="flex-1">
          <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">Two-Factor Authentication</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Require a 6-digit code from an authenticator app on every sign-in.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
            enabled
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {enabled ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
          {enabled ? 'On' : 'Off'}
        </span>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        {!enabled && !enrolling && (
          <div className="space-y-3">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Recommended for accounts with access to payroll, finance approvals, or workforce records.
              You'll need an authenticator app such as 1Password, Google Authenticator, or Authy.
            </p>
            <button
              type="button"
              onClick={startEnrollment}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Enable 2FA
            </button>
          </div>
        )}

        {enrolling && (
          <div className="space-y-5">
            <div className="text-[12px] text-slate-500 leading-relaxed">
              <strong className="text-slate-900">Step 1.</strong> Add this secret to your authenticator app. Tap the link on mobile to deep-link, or type it manually.
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secret (manual entry)</div>
              <div className="flex items-center gap-2">
                <code className="text-[12px] font-mono font-bold text-slate-900 tracking-widest break-all flex-1">
                  {enrolling.secretChunked}
                </code>
                <button
                  type="button"
                  onClick={() => copy('secret', enrolling.secret)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded uppercase tracking-widest"
                >
                  {copied === 'secret' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied === 'secret' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <a
                href={enrolling.otpauthUrl}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
              >
                <Smartphone className="w-3 h-3" />
                Open in authenticator (mobile)
              </a>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                  Backup codes — save these now
                </span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Use one if you lose your authenticator. Each works once. They won't be shown again.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {enrolling.backupCodes.map((c) => (
                  <code key={c} className="text-[12px] font-mono font-bold text-amber-900 bg-white border border-amber-200 rounded px-2 py-1 text-center">
                    {c}
                  </code>
                ))}
              </div>
              <button
                type="button"
                onClick={() => copy('codes', enrolling.backupCodes.join('\n'))}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-white rounded uppercase tracking-widest"
              >
                {copied === 'codes' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied === 'codes' ? 'Copied all' : 'Copy all'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] text-slate-500 leading-relaxed">
                <strong className="text-slate-900">Step 2.</strong> Enter the 6-digit code your app shows for "Suler EMS".
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\s/g, ''))}
                  placeholder="123456"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={confirmEnrollment}
                  disabled={busy || confirmCode.length < 6}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify & Enable'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setEnrolling(null); setConfirmCode(''); setError(null); }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest"
              >
                Cancel enrollment
              </button>
            </div>
          </div>
        )}

        {enabled && !enrolling && (
          <div className="space-y-3">
            <div className="text-[12px] text-slate-500 leading-relaxed">
              {lastUsedAt
                ? <>Last verified <strong className="text-slate-900">{new Date(lastUsedAt).toLocaleString()}</strong>.</>
                : <>Two-factor verification is active on this account.</>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setRegenerateOpen(true); setError(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate backup codes
              </button>
              <button
                type="button"
                onClick={() => { setDisablingOpen(true); setError(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                <ShieldOff className="w-3 h-3" />
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Disable modal ─────────────────────────────────────────────── */}
      <CodePromptModal
        isOpen={disablingOpen}
        title="Disable two-factor authentication"
        description="Enter your current 6-digit code (or an unused backup code) to confirm."
        confirmLabel="Disable 2FA"
        danger
        busy={busy}
        onClose={() => setDisablingOpen(false)}
        onSubmit={disable}
      />

      {/* ── Regenerate modal ──────────────────────────────────────────── */}
      <CodePromptModal
        isOpen={regenerateOpen}
        title="Regenerate backup codes"
        description="Enter your current 6-digit code from your authenticator app. Existing backup codes will be invalidated."
        confirmLabel="Generate new codes"
        busy={busy}
        onClose={() => setRegenerateOpen(false)}
        onSubmit={regenerate}
      />

      {/* ── Fresh codes display (after regenerate) ────────────────────── */}
      <Modal
        isOpen={freshCodes !== null}
        onClose={() => setFreshCodes(null)}
        title="New backup codes"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Old codes are now invalid. Save these somewhere safe — they won't be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(freshCodes ?? []).map((c) => (
              <code key={c} className="text-[12px] font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center">
                {c}
              </code>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => copy('fresh', (freshCodes ?? []).join('\n'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              {copied === 'fresh' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied === 'fresh' ? 'Copied' : 'Copy all'}
            </button>
            <button
              type="button"
              onClick={() => setFreshCodes(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
            >
              I've saved them
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Shared code-prompt modal ─────────────────────────────────────────

function CodePromptModal({
  isOpen, title, description, confirmLabel, danger, busy, onClose, onSubmit,
}: {
  isOpen:       boolean;
  title:        string;
  description:  string;
  confirmLabel: string;
  danger?:      boolean;
  busy:         boolean;
  onClose:      () => void;
  onSubmit:     (code: string) => void;
}) {
  const [code, setCode] = useState('');

  // Reset when re-opened.
  React.useEffect(() => { if (isOpen) setCode(''); }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-6 space-y-4">
        <p className="text-[12px] text-slate-500 leading-relaxed">{description}</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={20}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
          placeholder="123456"
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(code)}
            disabled={busy || code.length < 6}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50 ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
