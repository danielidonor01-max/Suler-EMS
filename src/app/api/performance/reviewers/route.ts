import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/performance/reviewers
 *
 * Returns the list of users HR can assign as reviewers on the cycle
 * detail page. Filtered to active accounts and ordered by name. HR /
 * SUPER_ADMIN only — regular employees don't need this.
 *
 * Intentionally separate from /api/admin/users (which needs role:manage)
 * because picking a reviewer doesn't require role-management rights.
 */

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required', 403, correlationId);
  }

  try {
    const users = await prisma.user.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true,
        role: { select: { name: true } },
        employee: { select: { jobTitle: true, branch: true } },
      },
    });
    return successResponse(users, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list reviewers';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});
