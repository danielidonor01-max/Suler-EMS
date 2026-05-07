import { redis } from "../../cache/redis";
import { log } from "../../observability/logger";

interface RateLimitPolicy {
  windowSeconds: number;
  maxRequests: number;
}

const POLICIES: Record<string, RateLimitPolicy> = {
  AUTH: { windowSeconds: 60, maxRequests: 5 }, // 5 attempts per minute
  INGESTION: { windowSeconds: 60, maxRequests: 60 }, // 1 per second per IP
  ANALYTICS: { windowSeconds: 60, maxRequests: 100 },
  DEFAULT: { windowSeconds: 60, maxRequests: 30 }
};

export class DistributedLimiter {
  /**
   * Check if a request should be rate limited
   */
  static async isLimited(
    identifier: string, 
    policyType: keyof typeof POLICIES = 'DEFAULT'
  ): Promise<{ limited: boolean; remaining: number; reset: number }> {
    const policy = POLICIES[policyType];
    const key = `ratelimit:${policyType}:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, policy.windowSeconds);
      }
      
      const limited = current > policy.maxRequests;
      
      if (limited) {
        log.security(`Rate limit exceeded for ${identifier} on ${policyType}`, 'WARNING', { identifier, policyType });
      }
      
      return {
        limited,
        remaining: Math.max(0, policy.maxRequests - current),
        reset: policy.windowSeconds
      };
    } catch (err) {
      // Fail open to avoid blocking users if Redis is down, but log the error
      log.error('Rate limit check failed', err);
      return { limited: false, remaining: 0, reset: 0 };
    }
  }
}
