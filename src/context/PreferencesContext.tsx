'use client';

/**
 * Per-user personal preferences.
 *
 * Stored in localStorage under `suler_prefs_<userId>_v1` so the same browser
 * can host multiple sessions without cross-contamination. Server-side mirror
 * lives on User.metadata (Phase 10+) — for now this is client-only state
 * with sensible defaults, which is fine because nothing in the data model
 * depends on a preference value.
 *
 * Surface:
 *   theme            'light' | 'dark' | 'system'   visual mode
 *   toastsEnabled    boolean                       suppress all toasts
 *   messageBadge     boolean                       show unread badge in header
 *   broadcastSounds  boolean                       play a tone on new broadcast (future)
 *   emailDigest      'off' | 'daily' | 'weekly'    email summary cadence (future server)
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
  theme: 'system',
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

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  // Load on userId change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPrefs({ ...DEFAULTS, ...parsed });
      } else {
        setPrefs(DEFAULTS);
      }
    } catch {
      setPrefs(DEFAULTS);
    }
    setReady(true);
  }, [userId]);

  const persist = useCallback((next: Preferences) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch { /* private mode or quota; preferences just won't persist */ }
  }, [userId]);

  const setPref = useCallback<PreferencesContextValue['setPref']>((key, value) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetAll = useCallback(() => {
    setPrefs(DEFAULTS);
    persist(DEFAULTS);
  }, [persist]);

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
      // `data-theme` attr on <html> is the canonical signal — globals.css
      // overrides body + workspace-main background under [data-theme="dark"].
      // `dark` class kept for any future Tailwind dark: variant usage.
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
