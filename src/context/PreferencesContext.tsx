'use client';

/**
 * Per-user personal preferences.
 *
 * Three-tier storage:
 *
 *   1. localStorage (instant first paint, offline-safe). Keyed per userId so
 *      multiple sessions in the same browser don't bleed.
 *   2. Server (authoritative — User.preferences Json column). Loaded once
 *      on session boot and rewritten whenever the user changes a value.
 *      A failure to read or write the server falls back silently to local
 *      only, so the UI never breaks if the API is briefly unavailable.
 *   3. DEFAULTS (compiled in) — what new accounts see until they save.
 *
 * Flow:
 *   - mount → seed from localStorage (instant)
 *   - mount → fetch server, replace state, write to localStorage
 *   - setPref → update state, write to localStorage, fire-and-forget PATCH
 *
 * Surface:
 *   theme            'light' | 'dark' | 'system'   visual mode
 *   toastsEnabled    boolean                       suppress all toasts
 *   messageBadge     boolean                       show unread badge in header
 *   broadcastSounds  boolean                       play a tone on new broadcast
 *   emailDigest      'off' | 'daily' | 'weekly'    email summary cadence
 *   language         'en'                          reserved; only EN today
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export type ThemePref = 'light' | 'dark' | 'system';
export type EmailDigestPref = 'off' | 'daily' | 'weekly';

export interface Preferences {
  theme: ThemePref;
  toastsEnabled: boolean;
  messageBadge: boolean;
  broadcastSounds: boolean;
  emailDigest: EmailDigestPref;
  language: 'en';
}

const DEFAULTS: Preferences = {
  theme: 'light',
  toastsEnabled: true,
  messageBadge: true,
  broadcastSounds: false,
  emailDigest: 'off',
  language: 'en',
};

interface PreferencesContextValue {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetAll: () => void;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function storageKey(userId: string | undefined): string {
  return `suler_prefs_${userId ?? 'anon'}_v1`;
}

function loadFromStorage(userId: string | undefined): Preferences {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveToStorage(userId: string | undefined, prefs: Preferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  } catch { /* private mode / quota — preferences just won't persist locally */ }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  // Seed from localStorage immediately on userId change so the UI doesn't
  // flicker waiting for the server. Then go fetch the server copy.
  useEffect(() => {
    setPrefs(loadFromStorage(userId));
    setReady(true);
  }, [userId]);

  // Pull authoritative copy from the server once the session is known.
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile/preferences', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const serverPrefs = (json?.data ?? json) as Preferences;
        if (cancelled) return;
        const merged = { ...DEFAULTS, ...serverPrefs };
        setPrefs(merged);
        saveToStorage(userId, merged);
      } catch {
        // Server unavailable — keep the localStorage copy and move on.
      }
    })();
    return () => { cancelled = true; };
  }, [status, userId]);

  const setPref = useCallback<PreferencesContextValue['setPref']>((key, value) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      saveToStorage(userId, next);
      // Fire-and-forget PATCH. Failure is silent — we already updated the
      // local copy, and the next session boot will reconcile if needed.
      if (status === 'authenticated' && userId) {
        fetch('/api/profile/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ [key]: value }),
        }).catch(() => { /* swallow — local is source of truth this paint */ });
      }
      return next;
    });
  }, [userId, status]);

  const resetAll = useCallback(() => {
    setPrefs(DEFAULTS);
    saveToStorage(userId, DEFAULTS);
    if (status === 'authenticated' && userId) {
      fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(DEFAULTS),
      }).catch(() => { /* same as setPref */ });
    }
  }, [userId, status]);

  // Apply theme to document root.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const resolve = (t: ThemePref): 'light' | 'dark' => {
      if (t === 'system') {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return t;
    };
    const apply = () => {
      const effective = resolve(prefs.theme);
      root.setAttribute('data-theme', effective);
      root.classList.toggle('dark', effective === 'dark');
    };
    apply();
    if (prefs.theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [prefs.theme]);

  const value = useMemo(() => ({ prefs, setPref, resetAll, ready }), [prefs, setPref, resetAll, ready]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
