import { redis } from "@/lib/cache/redis";
import { log } from "@/lib/observability/logger";

export class SessionService {
  private static SESSION_PREFIX = 'session:';

  /**
   * Register a new active session
   */
  static async registerSession(userId: string, sessionId: string, metadata: {
    ip: string;
    userAgent: string;
    deviceId?: string;
  }) {
    const key = `${this.SESSION_PREFIX}${userId}:${sessionId}`;
    const payload = JSON.stringify({
      ...metadata,
      createdAt: new Date(),
    });

    // Sessions expire in 7 days (matching JWT expiry usually)
    await redis.set(key, payload, { EX: 7 * 24 * 60 * 60 });
    
    log.info(`Session registered for user ${userId}`, { userId, sessionId, ip: metadata.ip });
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(userId: string, sessionId: string) {
    const key = `${this.SESSION_PREFIX}${userId}:${sessionId}`;
    await redis.del(key);
    log.security(`Session revoked for user ${userId}`, 'INFO', { userId, sessionId });
  }

  /**
   * Revoke ALL sessions for a user (e.g. on password change)
   */
  static async revokeAllSessions(userId: string) {
    const pattern = `${this.SESSION_PREFIX}${userId}:*`;
    const keys = await redis.client.keys(pattern);
    if (keys.length > 0) {
      await redis.client.del(keys);
    }
    log.security(`All sessions revoked for user ${userId}`, 'WARNING', { userId });
  }

  /**
   * Validate if a session is still active
   */
  static async isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    const key = `${this.SESSION_PREFIX}${userId}:${sessionId}`;
    const exists = await redis.get(key);
    return !!exists;
  }
}
