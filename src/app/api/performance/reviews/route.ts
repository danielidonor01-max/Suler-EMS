import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/performance/reviews?scope=mine|toConduct|all
 *
 *   mine       — reviews where I'm the subject (employee). Default for
 *                regular users.
 *   toConduct  — reviews assigned to me as reviewer. Useful for the
 *                manager queue.
 *   all        — every review across the org. HR / SUPER_ADMIN only.
 *
 * Optional ?status= filter.
 */

const QuerySchema = z.object({
  scope:  z.enum(['mine', 'toConduct', 'all']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'ACKNOWLEDGED']).optional(),
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const scope = parsed.data.scope ?? 'mine';
  const hr = isHR(session as any);
  if (scope === 'all' && !hr) {
    return errorResponse('FORBIDDEN', 'Only HR / admin can list every review', 403, correlationId);
  }

  const where: any = {};
  if (scope === 'mine') {
    if (!session.user.employeeId) return successResponse([], correlationId);
    where.employeeId = session.user.employeeId;
  } else if (scope === 'toConduct') {
    where.reviewerId = session.user.id;
  }
  if (parsed.data.status) where.status = parsed.data.status;

  try {
    const reviews = await prisma.performanceReview.findMany({
      where,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
      include: {
        cycle:    { select: { id: true, name: true, type: true, dueDate: true, status: true } },
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(reviews, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list reviews';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});
