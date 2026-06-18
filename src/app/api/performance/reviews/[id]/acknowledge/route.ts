import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/reviews/[id]/acknowledge
 *
 * Subject employee marks the SUBMITTED review as ACKNOWLEDGED.
 * Captures an optional final comment from the employee on the way
 * through. Closes out the workflow — HR sees ACKNOWLEDGED rows as
 * "complete" in the cycle dashboard.
 */

const Schema = z.object({
  employeeComments: z.string().max(4000).optional().nullable(),
});

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  let existing;
  try {
    existing = await prisma.performanceReview.findUniqueOrThrow({
      where: { id },
      include: { employee: { select: { id: true } } },
    });
  } catch {
    return errorResponse('NOT_FOUND', 'Review not found', 404, correlationId);
  }

  const isSubject = existing.employee.id === session.user.employeeId;
  if (!isSubject) {
    return errorResponse('FORBIDDEN', 'Only the subject employee can acknowledge', 403, correlationId);
  }
  if (existing.status !== 'SUBMITTED') {
    return errorResponse(
      'NOT_READY',
      `Cannot acknowledge from status ${existing.status}. The reviewer must submit first.`,
      409,
      correlationId,
    );
  }

  try {
    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        status:                 'ACKNOWLEDGED',
        employeeAcknowledgedAt: new Date(),
        employeeComments:       parsed.data.employeeComments ?? null,
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to acknowledge';
    return errorResponse('ACK_FAILED', msg, 500, correlationId);
  }
});
