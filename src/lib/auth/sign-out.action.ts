'use server';

import { signOut } from '@/lib/auth/auth.config';

/**
 * Server-side sign-out.
 *
 * The client-side next-auth/react signOut() fetch was unreliable on
 * production: our JWT carries the full permissions array, which pushes the
 * session cookie past 4 KB so Auth.js splits it into chunks
 * (authjs.session-token.0 / .1). The v5-beta client fetch didn't always
 * clear every chunk — a surviving chunk kept the session valid, proxy.ts
 * bounced /login back to /dashboard, and users had to mash Sign Out until
 * all chunks happened to die ("modal closes, page just refreshes" bug).
 *
 * Running signOut() inside a server action fixes this at the root: the
 * server enumerates every cookie it set (chunks included) and expires them
 * via Set-Cookie headers on the action response, which the browser applies
 * before the client navigates. redirect:false because the caller does its
 * own hard navigation to /login — deterministic, no NEXT_REDIRECT throw to
 * special-case.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
