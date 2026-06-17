import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * DELETE /api/teams/[id]/members/[employeeId]
 *
 * Remove an employee from a team. Idempotent — deleting a missing
 * membership returns 200 instead of 404 so retry storms (network
 * blip → client retry) don't surface confusing errors.
 */

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to manage team members', 403, correlationId);
  }

  const { id, employeeId } = (await context.params) as { id: string; employeeId: string };

  try {
    await prisma.teamMembership.deleteMany({
      where: { teamId: id, employeeId },
    });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to remove member';
    return errorResponse('REMOVE_FAILED', msg, 500, correlationId);
  }
});
