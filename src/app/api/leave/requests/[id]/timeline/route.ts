import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getLeaveRequest } from '@/modules/leave/domain/leave.service';

/**
 * GET /api/leave/requests/[id]/timeline
 *
 * Composite endpoint for the "View" affordance on the Request Tracker
 * and Approval Pipeline. Returns the request + its audit history + the
 * list of users who can advance it from its current state (so the UI
 * can label them "awaiting" and the Ping button knows who to notify).
 *
 * Authorization mirrors the base GET: the request's owner, or anyone
 * with leave:view (MANAGER / HR_ADMIN / SUPER_ADMIN).
 */

// Which role can act next, given the current workflow state. Mirrors the
// transitions in LeaveWorkflow but keeps this endpoint independent of the
// engine for resilience.
const NEXT_ROLE_BY_STATE: Record<string, string | null> = {
  DRAFT:            null, // employee themselves must SUBMIT
  SUBMITTED:        'MANAGER',
  MANAGER_APPROVED: 'HR_ADMIN',
  HR_APPROVED:      null, // terminal-approved
  REJECTED:         null,
  CANCELLED:        null,
};

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const request = await getLeaveRequest(id, { includeHistory: true });

    const isOwner = request.employee.id === session.user.employeeId;
    const canViewAll = ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!isOwner && !canViewAll) {
      return errorResponse('FORBIDDEN', 'You do not have access to this leave request', 403, correlationId);
    }

    const nextRole = NEXT_ROLE_BY_STATE[request.status] ?? null;

    // Active users with that role — these are the candidates for ping
    // notification and what the UI labels "Awaiting" in the timeline.
    // SUPER_ADMIN is always included as a fallback approver since they
    // can act at any state.
    let nextApprovers: Array<{ id: string; name: string; role: string }> = [];
    if (nextRole) {
      const candidates = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { name: { in: [nextRole, 'SUPER_ADMIN'] } },
        },
        select: {
          id: true, name: true,
          role: { select: { name: true } },
        },
      });
      nextApprovers = candidates.map(u => ({ id: u.id, name: u.name, role: u.role.name }));
    }

    return successResponse({
      request,
      history: request.history ?? [],
      nextRole,
      nextApprovers,
    }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Leave request not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});
