import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/cycles
 *
 *   GET  — list every cycle (HR / admin). Includes counts of reviews
 *          by status so the page can show "3 of 25 submitted".
 *   POST — create a new cycle. HR / SUPER_ADMIN only.
 */

const CreateSchema = z.object({
  name:        z.string().min(2).max(120),
  type:        z.enum(['QUARTERLY', 'ANNUAL', 'MID_YEAR', 'AD_HOC']).optional(),
  startDate:   z.coerce.date(),
  endDate:     z.coerce.date(),
  dueDate:     z.coerce.date().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
}).refine(d => d.endDate >= d.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required to view review cycles', 403, correlationId);
  }

  try {
    const cycles = await prisma.reviewCycle.findMany({
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      take: 50,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        reviews: { select: { status: true } },
      },
    });

    // Roll up per-status counts so the UI doesn't need a second query.
    const data = cycles.map(c => {
      const counts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, SUBMITTED: 0, ACKNOWLEDGED: 0 };
      for (const r of c.reviews) {
        counts[r.status] = (counts[r.status] ?? 0) + 1;
      }
      const { reviews: _drop, ...rest } = c;
      return { ...rest, reviewCount: c.reviews.length, statusCounts: counts };
    });

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list cycles';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required to create review cycles', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const cycle = await prisma.reviewCycle.create({
      data: {
        name:        parsed.data.name,
        type:        parsed.data.type ?? 'ANNUAL',
        startDate:   parsed.data.startDate,
        endDate:     parsed.data.endDate,
        dueDate:     parsed.data.dueDate ?? null,
        description: parsed.data.description ?? null,
        status:      'DRAFT',
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse({ ...cycle, reviewCount: 0, statusCounts: { PENDING: 0, IN_PROGRESS: 0, SUBMITTED: 0, ACKNOWLEDGED: 0 } }, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create cycle';
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
