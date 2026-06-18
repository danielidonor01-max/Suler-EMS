import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/feedback/[id]/submit
 *
 * The peer reviewer fills in the response and marks it SUBMITTED.
 * Only the reviewer can submit; HR cannot submit on someone's behalf
 * (otherwise the feedback isn't real peer feedback). Once SUBMITTED
 * the body is immutable — re-submission returns 409.
 */

const Schema = z.object({
  strengths:    z.string().max(2000).optional().nullable(),
  improvements: z.string().max(2000).optional().nullable(),
  comments:     z.string().max(2000).optional().nullable(),
  rating:       z.number().int().min(1).max(5).optional().nullable(),
}).refine(
  d => Boolean(d.strengths || d.improvements || d.comments || d.rating != null),
  { message: 'Provide at least one of: strengths, improvements, comments, rating' },
);

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const existing = await prisma.peerFeedbackRequest.findUniqueOrThrow({
      where: { id }, select: { reviewerId: true, status: true },
    });
    if (existing.reviewerId !== session.user.id) {
      return errorResponse('FORBIDDEN', 'Only the assigned reviewer can submit', 403, correlationId);
    }
    if (existing.status !== 'PENDING') {
      return errorResponse('IMMUTABLE', `Cannot submit — already ${existing.status}`, 409, correlationId);
    }

    const updated = await prisma.peerFeedbackRequest.update({
      where: { id },
      data: {
        strengths:    parsed.data.strengths ?? null,
        improvements: parsed.data.improvements ?? null,
        comments:     parsed.data.comments ?? null,
        rating:       parsed.data.rating ?? null,
        status:       'SUBMITTED',
        submittedAt:  new Date(),
      },
      include: {
        subject:  { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit feedback';
    return errorResponse('SUBMIT_FAILED', msg, 500, correlationId);
  }
});
