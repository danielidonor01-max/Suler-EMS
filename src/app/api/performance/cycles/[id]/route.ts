import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/cycles/[id]
 *
 *   GET    — full cycle + per-employee review list. HR / admin.
 *   PATCH  — update cycle fields (name, dates, status, description).
 *            Status transitions: DRAFT → OPEN → CLOSED.
 *   DELETE — drop the cycle and all reviews via CASCADE. HR / admin.
 */

const PatchSchema = z.object({
  name:        z.string().min(2).max(120).optional(),
  type:        z.enum(['QUARTERLY', 'ANNUAL', 'MID_YEAR', 'AD_HOC']).optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional(),
  dueDate:     z.coerce.date().nullable().optional(),
  status:      z.enum(['DRAFT', 'OPEN', 'CLOSED']).optional(),
  description: z.string().max(1000).nullable().optional(),
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    const cycle = await prisma.reviewCycle.findUniqueOrThrow({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
          include: {
            employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true, branch: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return successResponse(cycle, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cycle not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const cycle = await prisma.reviewCycle.update({
      where: { id },
      data:  parsed.data,
    });
    return successResponse(cycle, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update cycle';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Cycle not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    await prisma.reviewCycle.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete cycle';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Cycle not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
