import { createClient } from 'redis';
import { log } from '../observability/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => log.error('Redis Client Error', err));
redisClient.on('connect', () => log.info('Redis Client Connected'));

/**
 * Enterprise Redis Provider
 */
export const redis = {
  get: async (key: string) => {
    if (!redisClient.isOpen) await redisClient.connect();
    return redisClient.get(key);
  },
  set: async (key: string, value: string, options?: any) => {
    if (!redisClient.isOpen) await redisClient.connect();
    return redisClient.set(key, value, options);
  },
  del: async (key: string) => {
    if (!redisClient.isOpen) await redisClient.connect();
    return redisClient.del(key);
  },
  incr: async (key: string) => {
    if (!redisClient.isOpen) await redisClient.connect();
    return redisClient.incr(key);
  },
  expire: async (key: string, seconds: number) => {
    if (!redisClient.isOpen) await redisClient.connect();
    return redisClient.expire(key, seconds);
  },
  client: redisClient
};
