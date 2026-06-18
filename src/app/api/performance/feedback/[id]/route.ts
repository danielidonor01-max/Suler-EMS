import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/feedback/[id]
 *
 *   DELETE — cancel a feedback request. The requester (the person who
 *            created it) or HR can withdraw it. Only meaningful while
 *            it's still PENDING; submitted feedback is preserved.
 *
 * Submit / decline have their own routes for clarity.
 */

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const existing = await prisma.peerFeedbackRequest.findUniqueOrThrow({
      where: { id }, select: { requestedById: true, status: true },
    });
    const isOwner = existing.requestedById === session.user.id;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized', 403, correlationId);
    }
    if (existing.status !== 'PENDING') {
      return errorResponse('IMMUTABLE', 'Only pending requests can be withdrawn', 409, correlationId);
    }

    await prisma.peerFeedbackRequest.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to withdraw request';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Feedback request not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
