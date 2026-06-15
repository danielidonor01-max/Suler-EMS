import { PrismaClient } from '@prisma/client';
import { initEventSystem } from './events/init';

/**
 * Singleton Prisma client — applies in ALL environments, not just dev.
 *
 * Why production caching matters on Vercel: serverless functions reuse
 * warm instances. Without globalThis caching, hot invocations spawn a
 * new PrismaClient each time, multiplying connections AND causing
 * prepared statement name collisions ("s11 already exists", code 42P05)
 * against Supabase's pgBouncer pooler — which multiplexes connections
 * but does not isolate statement namespaces across them.
 *
 * Pairing this singleton with `?pgbouncer=true&connection_limit=1` on
 * DATABASE_URL (or with session-mode pooler on port 5432) is the
 * reliable configuration.
 */
const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();
globalThis.prisma = prisma;

initEventSystem();

export default prisma;
