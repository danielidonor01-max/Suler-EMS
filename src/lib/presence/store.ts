/**
 * In-memory presence store.
 *
 * Each authenticated client sends a heartbeat every 30s while their tab is
 * open; we record `lastSeenMs` keyed by userId. The "presence count" is
 * the number of unique users whose last heartbeat is within the active
 * window (90s by default — three missed heartbeats before we drop them).
 *
 * SINGLE-INSTANCE CAVEAT
 * ──────────────────────
 * This `Map` lives in the Node process. A single Vercel function instance
 * is fine for a small org; once you scale horizontally (multiple dynos,
 * preview deployments, edge runtime) the count fragments per instance and
 * the number you show will be wrong.
 *
 * Multi-instance fix: swap this Map for a Redis sorted-set scoped to the
 * deployment. Roughly:
 *   redis.zadd('presence', Date.now(), userId)              // heartbeat
 *   redis.zrangebyscore('presence', now - 90_000, '+inf')   // count
 *   redis.zremrangebyscore('presence', '-inf', now - 90_000) // sweep
 *
 * The PresenceStore class interface below is identical to what a Redis-
 * backed implementation would expose, so the swap is contained.
 */

const ACTIVE_WINDOW_MS = 90_000;
const SWEEP_INTERVAL_MS = 60_000;

interface PresenceEntry {
  lastSeenMs: number;
}

class PresenceStore {
  private entries = new Map<string, PresenceEntry>();
  private sweepTimer: NodeJS.Timeout | null = null;

  /**
   * Record a heartbeat for a user and return the current active count.
   * Lazy-starts the periodic sweep on first call so the timer doesn't
   * run when nobody is connected.
   */
  recordHeartbeat(userId: string): number {
    this.entries.set(userId, { lastSeenMs: Date.now() });
    if (!this.sweepTimer) this.startSweep();
    return this.activeCount();
  }

  activeCount(): number {
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.lastSeenMs >= cutoff) count++;
    }
    return count;
  }

  /** Drop stale entries — keeps the Map from growing unbounded. */
  private startSweep(): void {
    this.sweepTimer = setInterval(() => {
      const cutoff = Date.now() - ACTIVE_WINDOW_MS;
      for (const [userId, entry] of this.entries.entries()) {
        if (entry.lastSeenMs < cutoff) this.entries.delete(userId);
      }
      // If nobody is left, stop sweeping until the next heartbeat.
      if (this.entries.size === 0 && this.sweepTimer) {
        clearInterval(this.sweepTimer);
        this.sweepTimer = null;
      }
    }, SWEEP_INTERVAL_MS).unref?.() as any;
  }
}

// Singleton — Next.js module caching keeps this alive across requests
// inside one instance. globalThis pin so dev-mode hot reload doesn't
// blow away the state on every edit.
declare global {
  // eslint-disable-next-line no-var
  var __sulerPresenceStore: PresenceStore | undefined;
}

export const presenceStore: PresenceStore =
  globalThis.__sulerPresenceStore ?? (globalThis.__sulerPresenceStore = new PresenceStore());
