import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/kpis
 *
 *   GET  — list KPIs. scope=mine for the caller's own; scope=all for HR.
 *          Includes measurements (latest 12) so the page can render a
 *          trend chart without a second query.
 *   POST — create. Employees can create their own (self-tracked metrics);
 *          HR can create for anyone via body.employeeId.
 */

const FrequencyEnum = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']);
const StatusEnum    = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);

const CreateSchema = z.object({
  employeeId:  z.string().uuid().optional(),
  title:       z.string().min(2).max(120),
  description: z.string().max(1000).optional().nullable(),
  target:      z.number(),
  unit:        z.string().max(20).optional().nullable(),
  frequency:   FrequencyEnum.optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional().nullable(),
});

const ListQuerySchema = z.object({
  scope:      z.enum(['mine', 'all']).optional(),
  status:     StatusEnum.optional(),
  employeeId: z.string().uuid().optional(),
});

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const employeeId = session.user.employeeId;
  const hr = isHR(session as any);
  const scope = parsed.data.scope ?? (hr ? 'all' : 'mine');

  if (scope === 'all' && !hr) {
    return errorResponse('FORBIDDEN', 'Only HR / admin can list all KPIs', 403, correlationId);
  }
  if (scope === 'mine' && !employeeId) {
    return successResponse([], correlationId);
  }

  const where: any = {};
  if (scope === 'mine') where.employeeId = employeeId;
  if (parsed.data.employeeId && hr) where.employeeId = parsed.data.employeeId;
  if (parsed.data.status) where.status = parsed.data.status;

  try {
    const kpis = await prisma.performanceKPI.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        employee:     { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:        { select: { id: true, name: true, email: true } },
        measurements: {
          orderBy: { periodStart: 'desc' },
          take:    12,
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
    return successResponse(kpis, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list KPIs';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const targetEmployeeId = parsed.data.employeeId ?? session.user.employeeId;
  if (!targetEmployeeId) {
    return errorResponse('NO_EMPLOYEE', 'No employee record linked', 400, correlationId);
  }
  const isSelf = targetEmployeeId === session.user.employeeId;
  if (!isSelf && !isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'Only HR can create KPIs for others', 403, correlationId);
  }

  try {
    const kpi = await prisma.performanceKPI.create({
      data: {
        employeeId:  targetEmployeeId,
        ownerId:     session.user.id,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        target:      parsed.data.target,
        unit:        parsed.data.unit ?? null,
        frequency:   parsed.data.frequency ?? 'MONTHLY',
        startDate:   parsed.data.startDate ?? new Date(),
        endDate:     parsed.data.endDate ?? null,
        status:      'ACTIVE',
      },
      include: {
        employee:     { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:        { select: { id: true, name: true, email: true } },
        measurements: true,
      },
    });
    return successResponse(kpi, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create KPI';
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
