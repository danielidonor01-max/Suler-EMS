import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/reviews/[id]/submit
 *
 * Reviewer marks the review as SUBMITTED — locks in the rating +
 * comments and unblocks the employee's view of the content. HR can
 * also submit on a reviewer's behalf if they've been reassigned mid-
 * flight. Notifies the employee so they don't have to keep checking.
 *
 * Requires overallRating to be set; can't submit a half-filled review.
 */

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const POST = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  let existing;
  try {
    existing = await prisma.performanceReview.findUniqueOrThrow({
      where: { id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, user: { select: { id: true } } } },
        cycle:    { select: { id: true, name: true } },
      },
    });
  } catch {
    return errorResponse('NOT_FOUND', 'Review not found', 404, correlationId);
  }

  const isReviewer = existing.reviewerId === session.user.id;
  const hr         = isHR(session as any);
  if (!isReviewer && !hr) {
    return errorResponse('FORBIDDEN', 'Only the reviewer or HR can submit', 403, correlationId);
  }
  if (existing.status === 'SUBMITTED' || existing.status === 'ACKNOWLEDGED') {
    return errorResponse('ALREADY_SUBMITTED', 'Review has already been submitted', 409, correlationId);
  }
  if (!existing.overallRating) {
    return errorResponse(
      'INCOMPLETE',
      'Cannot submit without an overall rating. Add a rating then try again.',
      400,
      correlationId,
    );
  }

  try {
    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        status:      'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Notify the subject employee (if they have a linked User account)
    // so they can acknowledge it. Best-effort; doesn't roll back submit.
    if (existing.employee.user?.id) {
      const employeeName = `${existing.employee.firstName} ${existing.employee.lastName}`;
      await prisma.notification.create({
        data: {
          userId:       existing.employee.user.id,
          title:        `Performance review ready — ${existing.cycle.name}`,
          message:      `${session.user.name ?? 'Your reviewer'} has submitted your ${existing.cycle.name} performance review. Open Performance to view and acknowledge.`,
          type:         'INFO',
          category:     'WORKFLOW',
          priority:     'NORMAL',
          status:       'PENDING',
          resourceId:   updated.id,
          resourceType: 'PerformanceReview',
          metadata: {
            kind:        'review-submitted',
            cycleId:     existing.cycle.id,
            cycleName:   existing.cycle.name,
            employeeName,
          } as any,
        },
      }).catch(() => {});
    }

    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit';
    return errorResponse('SUBMIT_FAILED', msg, 500, correlationId);
  }
});
