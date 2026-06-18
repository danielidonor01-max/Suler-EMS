import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/reviews/[id]
 *
 *   GET    — full review. Visible to subject employee, the reviewer,
 *            or HR / SUPER_ADMIN. Compliance: an employee can't see
 *            their own review until the reviewer has SUBMITTED it.
 *   PATCH  — partial update. Action determines who can do what:
 *              reviewer:  rating / strengths / areasForGrowth /
 *                         reviewerComments — only while PENDING /
 *                         IN_PROGRESS.
 *              employee:  employeeComments after status=SUBMITTED.
 *              HR:        anything (override / correct).
 *   POST   — see /submit and /acknowledge subroutes for the explicit
 *            state transitions. PATCH leaves status untouched.
 */

const PatchSchema = z.object({
  overallRating:    z.number().int().min(1).max(5).nullable().optional(),
  strengths:        z.string().max(4000).nullable().optional(),
  areasForGrowth:   z.string().max(4000).nullable().optional(),
  reviewerComments: z.string().max(4000).nullable().optional(),
  employeeComments: z.string().max(4000).nullable().optional(),
  reviewerId:       z.string().uuid().nullable().optional(), // HR can re-assign
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const review = await prisma.performanceReview.findUniqueOrThrow({
      where: { id },
      include: {
        cycle:    { select: { id: true, name: true, type: true, startDate: true, endDate: true, dueDate: true, status: true } },
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    const isSubject  = review.employee.id === session.user.employeeId;
    const isReviewer = review.reviewer?.id === session.user.id;
    const hr         = isHR(session as any);

    if (!isSubject && !isReviewer && !hr) {
      return errorResponse('FORBIDDEN', 'Not authorized', 403, correlationId);
    }

    // Employee can't see the rating / strengths until the reviewer
    // has submitted. Until then, return a "still being prepared" view.
    if (isSubject && !isReviewer && !hr && review.status !== 'SUBMITTED' && review.status !== 'ACKNOWLEDGED') {
      return successResponse({
        ...review,
        overallRating:    null,
        strengths:        null,
        areasForGrowth:   null,
        reviewerComments: null,
        _redactedReason:  'Review is still being prepared by your reviewer.',
      }, correlationId);
    }

    return successResponse(review, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Review not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
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

  const isSubject  = existing.employee.id === session.user.employeeId;
  const isReviewer = existing.reviewerId === session.user.id;
  const hr         = isHR(session as any);

  // Field-by-field gating. Anything the caller isn't allowed to touch
  // gets stripped before the write so a sneaky client can't slip a
  // rating change through their employeeComments PATCH.
  const data: any = {};

  // Reviewer fields — only the reviewer or HR can write, and only
  // while the review hasn't been submitted yet.
  const canEditReviewer =
    (isReviewer || hr) && (existing.status === 'PENDING' || existing.status === 'IN_PROGRESS');
  if (canEditReviewer) {
    if (parsed.data.overallRating !== undefined)    data.overallRating    = parsed.data.overallRating;
    if (parsed.data.strengths !== undefined)        data.strengths        = parsed.data.strengths;
    if (parsed.data.areasForGrowth !== undefined)   data.areasForGrowth   = parsed.data.areasForGrowth;
    if (parsed.data.reviewerComments !== undefined) data.reviewerComments = parsed.data.reviewerComments;
    // Touching anything reviewer-side flips PENDING → IN_PROGRESS
    // so the queue badges update without an explicit save step.
    if (existing.status === 'PENDING' && Object.keys(data).length > 0) {
      data.status = 'IN_PROGRESS';
    }
  }

  // Employee comments — only the subject, only after submit.
  if (parsed.data.employeeComments !== undefined && (isSubject || hr)) {
    if (existing.status === 'SUBMITTED' || existing.status === 'ACKNOWLEDGED' || hr) {
      data.employeeComments = parsed.data.employeeComments;
    }
  }

  // Reviewer reassignment — HR only.
  if (parsed.data.reviewerId !== undefined && hr) {
    data.reviewerId = parsed.data.reviewerId;
  }

  if (Object.keys(data).length === 0) {
    return errorResponse('FORBIDDEN', 'No editable fields for your role / current status', 403, correlationId);
  }

  try {
    const updated = await prisma.performanceReview.update({
      where: { id },
      data,
      include: {
        cycle:    { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update review';
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});
