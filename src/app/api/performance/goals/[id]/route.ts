import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/goals/[id]
 *
 *   PATCH  — update a goal. Owner OR HR. Common updates: progress
 *            percent, status transitions, notes appending, due date
 *            adjustments.
 *   DELETE — owner OR HR. Hard delete — for archive semantics use
 *            status=CANCELLED instead.
 */

const PatchSchema = z.object({
  title:           z.string().min(2).max(200).optional(),
  description:     z.string().max(2000).nullable().optional(),
  category:        z.enum(['INDIVIDUAL', 'TEAM', 'ORGANIZATIONAL']).optional(),
  dueDate:         z.coerce.date().nullable().optional(),
  status:          z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  notes:           z.string().max(2000).nullable().optional(),
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const existing = await prisma.performanceGoal.findUniqueOrThrow({
      where: { id },
      select: { employeeId: true },
    });
    const isOwner = existing.employeeId === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized to edit this goal', 403, correlationId);
    }

    // Auto-bump progress to 100 when transitioning to COMPLETED so the
    // chart doesn't show a 73% goal marked as done. The user can still
    // override progressPercent in the same patch if they want.
    const data: any = { ...parsed.data };
    if (parsed.data.status === 'COMPLETED' && parsed.data.progressPercent === undefined) {
      data.progressPercent = 100;
    }

    const updated = await prisma.performanceGoal.update({
      where: { id },
      data,
      include: {
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:    { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update goal';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Goal not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const existing = await prisma.performanceGoal.findUniqueOrThrow({
      where: { id },
      select: { employeeId: true },
    });
    const isOwner = existing.employeeId === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized to delete this goal', 403, correlationId);
    }

    await prisma.performanceGoal.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete goal';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Goal not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
