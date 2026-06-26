import { withAuth } from '@/lib/api/with-auth';
import { successResponse } from '@/lib/api-utils';
import { presenceStore } from '@/lib/presence/store';

/**
 * POST /api/presence/heartbeat
 *
 * Authenticated tab pings here every 30s. We record the user as active
 * and return the current presence count so the client can update the
 * header indicator immediately without a second request.
 *
 * The store is in-memory and lives on the function instance — see
 * src/lib/presence/store.ts for the multi-instance caveat.
 */
export const POST = withAuth(async (_req, session) => {
  const count = presenceStore.recordHeartbeat(session.user.id);
  return successResponse({ presenceCount: count });
});
