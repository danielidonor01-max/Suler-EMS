import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/profile/change-requests
 *
 * POST — non-privileged employees use this to request a change to a
 *        protected field on their own profile. The request is captured as
 *        a Notification record (type=ACTION, category=WORKFLOW) addressed
 *        to every active HR_ADMIN + SUPER_ADMIN, so it shows up in their
 *        inbox queue immediately.
 *
 * Note: this is a stub. A dedicated ProfileChangeRequest schema with a
 *       proper approve/reject workflow + audit attribution is a follow-up.
 *       For now the Notification trail gives HR enough context to action
 *       the request manually and the employee a record that they asked.
 */

const ChangeRequestSchema = z.object({
  field:       z.string().min(2).max(60),
  proposedValue: z.string().max(500).optional().nullable(),
  reason:      z.string().min(5, 'Please briefly explain what you want changed').max(1000),
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!session.user.employeeId) {
    return errorResponse(
      'NO_EMPLOYEE',
      'Your account is not linked to an employee record',
      400,
      correlationId,
    );
  }

  const body = await req.json();
  const parsed = ChangeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const employee = await prisma.employee.findUniqueOrThrow({
      where:  { id: session.user.employeeId },
      select: { id: true, firstName: true, lastName: true, staffId: true },
    });

    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ['HR_ADMIN', 'SUPER_ADMIN'] } },
      },
      select: { id: true },
    });

    if (recipients.length === 0) {
      return errorResponse(
        'NO_APPROVERS',
        'No active HR or admin users to notify.',
        500,
        correlationId,
      );
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const title = `Profile change request — ${employeeName}`;
    const message =
      `${employeeName} (${employee.staffId}) is requesting a change to their ${parsed.data.field}. ` +
      `Reason: ${parsed.data.reason}`;

    await prisma.notification.createMany({
      data: recipients.map(u => ({
        userId:       u.id,
        title,
        message,
        type:         'ACTION',
        category:     'WORKFLOW',
        priority:     'NORMAL',
        status:       'PENDING',
        resourceId:   employee.id,
        resourceType: 'Employee',
        metadata:     {
          kind:           'profile-change-request',
          requestedBy:    session.user.id,
          requestedByName: session.user.name ?? session.user.email,
          employeeId:     employee.id,
          field:          parsed.data.field,
          proposedValue:  parsed.data.proposedValue ?? null,
          reason:         parsed.data.reason,
        } as any,
      })),
    });

    return successResponse(
      {
        ok: true,
        recipientCount: recipients.length,
        message: 'Your request has been sent to HR for review.',
      },
      correlationId,
      201,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit change request';
    return errorResponse('REQUEST_FAILED', msg, 500, correlationId);
  }
});
