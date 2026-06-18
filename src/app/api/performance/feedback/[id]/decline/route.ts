import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/feedback/[id]/decline
 *
 * Reviewer can decline with an optional reason. PENDING → DECLINED.
 * Declined rows are kept (not deleted) so HR can see who declined what
 * — useful for picking a backup reviewer or noticing a pattern of
 * declines on one subject.
 */

const Schema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const existing = await prisma.peerFeedbackRequest.findUniqueOrThrow({
      where: { id }, select: { reviewerId: true, status: true },
    });
    if (existing.reviewerId !== session.user.id) {
      return errorResponse('FORBIDDEN', 'Only the assigned reviewer can decline', 403, correlationId);
    }
    if (existing.status !== 'PENDING') {
      return errorResponse('IMMUTABLE', `Cannot decline — already ${existing.status}`, 409, correlationId);
    }

    const updated = await prisma.peerFeedbackRequest.update({
      where: { id },
      data: {
        status:         'DECLINED',
        declinedReason: parsed.data.reason ?? null,
      },
    });

    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to decline';
    return errorResponse('DECLINE_FAILED', msg, 500, correlationId);
  }
});
