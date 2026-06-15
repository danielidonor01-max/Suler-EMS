'use client';

/**
 * useSessionVersion — polls /api/auth/session-version every 60s and triggers
 * NextAuth's `session.update()` if the DB version is ahead of the JWT
 * version. The `update()` call lands in the `jwt` callback with
 * `trigger === 'update'`, which re-reads the user from Prisma and emits a
 * fresh JWT with current role + permissions.
 *
 * Mount this once at the layout root via SessionVersionWatcher.
 *
 * See ARCHITECTURE.md §11.
 */
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const POLL_MS = 60_000;

export function useSessionVersion() {
  const { data: session, status, update } = useSession();
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;

    async function check() {
      if (refreshingRef.current) return;
      try {
        const res = await fetch('/api/auth/session-version', { credentials: 'include' });
        if (!res.ok) return;
        const body = await res.json();
        const dbVersion = Number(body?.data?.version ?? 0);
        const sessionVersion = Number((session?.user as any)?.version ?? 0);
        if (dbVersion > sessionVersion && !cancelled) {
          refreshingRef.current = true;
          await update(); // → jwt callback runs with trigger='update'
          refreshingRef.current = false;
        }
      } catch {
        // network blip — try again next tick
      }
    }

    check();
    const t = setInterval(check, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [session, status, update]);
}
