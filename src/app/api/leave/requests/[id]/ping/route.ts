import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/leave/requests/[id]/ping
 *
 * Nudge the next approver(s) — sends an in-app Notification to every
 * active user whose role can advance the request from its current state.
 * SUPER_ADMINs always receive a copy as fallback approvers.
 *
 * Authorization: the request's owner (employees ping for their own
 * pending leave) OR anyone with leave:view (a delegate / HR rep can
 * nudge on behalf of an employee).
 *
 * Rate limit: at most one ping per 30 minutes per request, computed
 * from existing PING-category notifications. This stops noisy
 * employees from spamming managers without imposing a column on
 * LeaveRequest.
 */

const NEXT_ROLE_BY_STATE: Record<string, string | null> = {
  DRAFT:            null,
  SUBMITTED:        'MANAGER',
  MANAGER_APPROVED: 'HR_ADMIN',
  HR_APPROVED:      null,
  REJECTED:         null,
  CANCELLED:        null,
};

const PING_COOLDOWN_MS = 30 * 60 * 1000;

export const POST = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const leave = await prisma.leaveRequest.findUniqueOrThrow({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Authorization
    const isOwner = leave.employee.id === session.user.employeeId;
    const canPing = ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!isOwner && !canPing) {
      return errorResponse('FORBIDDEN', 'You do not have permission to ping on this request', 403, correlationId);
    }

    const nextRole = NEXT_ROLE_BY_STATE[leave.status];
    if (!nextRole) {
      return errorResponse(
        'NOT_PINGABLE',
        `Request is in state ${leave.status} — no further approval needed.`,
        409,
        correlationId,
      );
    }

    // Rate-limit: look at the most recent ping notification for this
    // resource. If it's within the cooldown window, refuse with a
    // helpful error showing when the next ping is allowed.
    const recentPing = await prisma.notification.findFirst({
      where: {
        resourceType: 'LeaveRequest',
        resourceId:   leave.id,
        type:         'ACTION',
        category:     'WORKFLOW',
        metadata:     { path: ['kind'], equals: 'ping' } as any,
      },
      orderBy: { createdAt: 'desc' },
      select:  { createdAt: true },
    });
    if (recentPing) {
      const ageMs = Date.now() - recentPing.createdAt.getTime();
      if (ageMs < PING_COOLDOWN_MS) {
        const waitMin = Math.ceil((PING_COOLDOWN_MS - ageMs) / 60_000);
        return errorResponse(
          'RATE_LIMITED',
          `Already pinged recently. Try again in ${waitMin} minute${waitMin === 1 ? '' : 's'}.`,
          429,
          correlationId,
        );
      }
    }

    // Find recipients — active users with the next-acting role + SUPER_ADMINs.
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: [nextRole, 'SUPER_ADMIN'] } },
      },
      select: { id: true },
    });

    if (recipients.length === 0) {
      return errorResponse(
        'NO_APPROVERS',
        `No active ${nextRole} or SUPER_ADMIN users to notify.`,
        500,
        correlationId,
      );
    }

    const fromName = session.user.name ?? session.user.email ?? 'A user';
    const employeeName = `${leave.employee.firstName} ${leave.employee.lastName}`;
    const title = `Leave approval reminder — ${employeeName}`;
    const message =
      `${fromName} is nudging this ${nextRole === 'HR_ADMIN' ? 'final HR approval' : 'manager approval'} ` +
      `for ${employeeName}'s ${leave.type.toLowerCase()} leave request.`;

    await prisma.notification.createMany({
      data: recipients.map(u => ({
        userId:       u.id,
        title,
        message,
        type:         'ACTION',
        category:     'WORKFLOW',
        priority:     'HIGH',
        status:       'PENDING',
        resourceId:   leave.id,
        resourceType: 'LeaveRequest',
        metadata:     {
          kind: 'ping',
          fromUserId: session.user.id,
          fromName,
          leaveType: leave.type,
          employeeId: leave.employee.id,
          employeeName,
        } as any,
      })),
    });

    return successResponse({
      ok: true,
      recipientCount: recipients.length,
      nextRole,
    }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send ping';
    if (msg.includes('Record to update not found') || msg.includes('No LeaveRequest')) {
      return errorResponse('NOT_FOUND', 'Leave request not found', 404, correlationId);
    }
    return errorResponse('PING_FAILED', msg, 500, correlationId);
  }
});
