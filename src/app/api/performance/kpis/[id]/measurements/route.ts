import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/kpis/[id]/measurements
 *
 * Records the actual value for one reporting period. periodStart is
 * the canonical timestamp; together with kpiId it's the uniqueness
 * key, so re-posting the same period upserts (HR can correct a typo
 * without ending up with duplicates).
 *
 * Subject employee can self-log; HR can log for anyone.
 */

const Schema = z.object({
  periodStart: z.coerce.date(),
  periodEnd:   z.coerce.date(),
  actualValue: z.number(),
  notes:       z.string().max(500).optional().nullable(),
}).refine(d => d.periodEnd >= d.periodStart, {
  message: 'periodEnd must be on or after periodStart',
  path: ['periodEnd'],
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const kpi = await prisma.performanceKPI.findUniqueOrThrow({
      where: { id }, select: { employeeId: true, status: true },
    });
    const isOwner = kpi.employeeId === session.user.employeeId;
    if (!isOwner && !isHR(session as any)) {
      return errorResponse('FORBIDDEN', 'Not authorized', 403, correlationId);
    }
    if (kpi.status === 'ARCHIVED') {
      return errorResponse('ARCHIVED', 'KPI is archived — unarchive to record new measurements', 409, correlationId);
    }

    // Upsert on (kpiId, periodStart) so corrections overwrite rather
    // than duplicate. Common case: someone logs Aug 2026 with a typo,
    // re-submits, and expects the latest write to win.
    const measurement = await prisma.kPIMeasurement.upsert({
      where: { kpiId_periodStart: { kpiId: id, periodStart: parsed.data.periodStart } },
      update: {
        periodEnd:    parsed.data.periodEnd,
        actualValue:  parsed.data.actualValue,
        notes:        parsed.data.notes ?? null,
        recordedById: session.user.id,
      },
      create: {
        kpiId:        id,
        periodStart:  parsed.data.periodStart,
        periodEnd:    parsed.data.periodEnd,
        actualValue:  parsed.data.actualValue,
        notes:        parsed.data.notes ?? null,
        recordedById: session.user.id,
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    return successResponse(measurement, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to record measurement';
    return errorResponse('RECORD_FAILED', msg, 500, correlationId);
  }
});
