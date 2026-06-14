'use client';

import { useSessionVersion } from './use-session-version';

/**
 * SessionVersionWatcher — invisible mount point. Add once near the auth
 * root so the polling hook runs for the entire authenticated session.
 */
export function SessionVersionWatcher() {
  useSessionVersion();
  return null;
}
