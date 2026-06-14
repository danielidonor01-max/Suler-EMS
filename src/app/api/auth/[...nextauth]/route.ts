/**
 * NextAuth v5 catch-all route.
 *
 * Canonical export form: destructure GET/POST from `handlers` directly so
 * Next.js App Router sees the original function signature (request + route
 * context). The previous version wrapped handlers in `(req) => handlers.GET(req)`,
 * which stripped the route params context and made NextAuth's internal
 * resolution throw a generic "server configuration" error before any
 * callback ran.
 */
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
