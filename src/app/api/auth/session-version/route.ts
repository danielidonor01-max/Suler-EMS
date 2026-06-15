import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/auth/session-version
 *
 * Returns the calling user's current `User.version` from the DB. Client polls
 * this every 60s; if the returned version is higher than the one cached in
 * the session, the client triggers `session.update()` to refresh the JWT
 * (which re-reads role.permissions from DB).
 *
 * See ARCHITECTURE.md §11.
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { version: true, isActive: true },
  });
  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'Session user no longer exists', 401, correlationId);
  }
  if (!user.isActive) {
    return errorResponse('USER_INACTIVE', 'Account is deactivated', 401, correlationId);
  }
  return successResponse({ version: user.version }, correlationId);
});
