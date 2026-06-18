import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/kpis/[id]
 *
 *   PATCH  — update KPI definition. Owner (subject employee) OR HR.
 *   DELETE — hard delete. Same gating. CASCADE removes measurements.
 */

const PatchSchema = z.object({
  title:       z.string().min(2).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  target:      z.number().optional(),
  unit:        z.string().max(20).nullable().optional(),
  frequency:   z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().nullable().optional(),
  status:      z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
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
    const existing = await prisma.performanceKPI.findUniqueOrThrow({
      where: { id }, select: { employeeId: true },
    });
    const isOwner = existing.employeeId === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized', 403, correlationId);
    }

    const updated = await prisma.performanceKPI.update({
      where: { id },
      data:  parsed.data,
      include: {
        employee:     { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:        { select: { id: true, name: true, email: true } },
        measurements: { orderBy: { periodStart: 'desc' }, take: 12 },
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update KPI';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'KPI not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  try {
    const existing = await prisma.performanceKPI.findUniqueOrThrow({
      where: { id }, select: { employeeId: true },
    });
    const isOwner = existing.employeeId === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized', 403, correlationId);
    }

    await prisma.performanceKPI.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete KPI';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'KPI not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
