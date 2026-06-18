'use client';

/**
 * Idle-session enforcement.
 *
 * Tracks user activity (mouse / keyboard / touch / scroll) and signs
 * the user out after `idleTimeoutMinutes` minutes of no activity.
 * Shows a warning modal `warnBeforeMinutes` minutes before the cut so
 * the user can stay signed in if they're actively working but happen
 * to not be moving the mouse (e.g. reading a long report).
 *
 * Policy pulled from /api/settings (filtered to SECURITY). Re-fetched
 * every 5 minutes so admin changes propagate without a full reload.
 *
 * Only active for authenticated sessions — does nothing on /login.
 */

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';

interface PolicyRow { key: string; value: unknown; }

// Defaults that match the server-side DEFAULTS in lib/settings/service.ts.
// Used until the first policy fetch completes so the timer doesn't start
// with zero (which would log everyone out instantly).
const FALLBACK_IDLE_MIN = 30;
const FALLBACK_WARN_MIN = 2;

export function IdleSessionMonitor() {
  const { status } = useSession();
  const [idleMin, setIdleMin] = useState(FALLBACK_IDLE_MIN);
  const [warnMin, setWarnMin] = useState(FALLBACK_WARN_MIN);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 1) Fetch live policy from /api/settings on mount + every 5 min.
  useEffect(() => {
    if (status !== 'authenticated') return;

    let cancelled = false;
    const fetchPolicy = async () => {
      try {
        const res = await fetch('/api/settings?category=SECURITY', { credentials: 'include' });
        if (!res.ok) return; // non-admin gets 403; fall back to defaults
        const json = await res.json();
        const rows: PolicyRow[] = json?.data ?? [];
        if (cancelled) return;

        const findNumber = (key: string, fallback: number): number => {
          const found = rows.find(r => r.key === key);
          const n = Number(found?.value);
          return Number.isFinite(n) && n > 0 ? n : fallback;
        };
        setIdleMin(findNumber('security.session.idleTimeoutMinutes', FALLBACK_IDLE_MIN));
        setWarnMin(findNumber('security.session.warnBeforeMinutes',  FALLBACK_WARN_MIN));
      } catch { /* silent — keep last known values */ }
    };

    fetchPolicy();
    const t = setInterval(fetchPolicy, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [status]);

  // ── 2) Activity listeners.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      // If the warning modal is open and the user moved, treat it as
      // "stay signed in" — they're clearly still there.
      if (warningOpen) {
        setWarningOpen(false);
      }
    };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
    };
  }, [status, warningOpen]);

  // ── 3) Periodic check — every 15s, compare last activity to policy.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const tick = () => {
      const idleMs = Date.now() - lastActivityRef.current;
      const totalMs = idleMin * 60 * 1000;
      const warnMs  = warnMin * 60 * 1000;
      const remaining = totalMs - idleMs;

      if (remaining <= 0) {
        setWarningOpen(false);
        signOut({ callbackUrl: '/login?reason=idle' });
        return;
      }
      if (remaining <= warnMs) {
        setSecondsLeft(Math.max(0, Math.floor(remaining / 1000)));
        setWarningOpen(true);
      } else if (warningOpen) {
        setWarningOpen(false);
      }
    };

    tick();
    checkIntervalRef.current = setInterval(tick, 15_000);
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [status, idleMin, warnMin, warningOpen]);

  // Live countdown while the warning is showing — separate effect so
  // it ticks every second without disturbing the main check loop.
  useEffect(() => {
    if (!warningOpen) return;
    const t = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [warningOpen]);

  if (status !== 'authenticated') return null;

  const stayActive = () => {
    lastActivityRef.current = Date.now();
    setWarningOpen(false);
  };

  return (
    <Modal isOpen={warningOpen} onClose={stayActive} title="You're about to be signed out" size="sm">
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Idle session detected</h3>
            <p className="text-[12px] text-slate-500 mt-1">
              You&apos;ll be signed out in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong> for security.
              Move the mouse, scroll, or click <strong>Stay Signed In</strong> to continue.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <span className="text-[11px] text-slate-600">
            Idle timeout is {idleMin} min — set by your administrator under <strong>Settings &rarr; Security</strong>.
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest"
          >
            Sign Out Now
          </button>
          <button
            type="button"
            onClick={stayActive}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </Modal>
  );
}
