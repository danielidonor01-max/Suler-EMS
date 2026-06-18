import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/performance/goals
 *
 *   GET  — list goals. scope=mine returns the calling user's goals;
 *          scope=all returns every employee's goals (HR / SUPER_ADMIN
 *          only). Default scope is mine for regular employees, all
 *          for HR / SUPER_ADMIN. Optional ?status= filter.
 *   POST — create a goal for the calling user OR (HR-only) for any
 *          employee specified via body.employeeId.
 */

const CategoryEnum = z.enum(['INDIVIDUAL', 'TEAM', 'ORGANIZATIONAL']);
const StatusEnum   = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED']);

const CreateSchema = z.object({
  // Optional — defaults to the caller's employeeId; HR can target others.
  employeeId:  z.string().uuid().optional(),
  title:       z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  category:    CategoryEnum.optional(),
  dueDate:     z.coerce.date().optional().nullable(),
  status:      StatusEnum.optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  notes:       z.string().max(2000).optional().nullable(),
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
    return errorResponse('FORBIDDEN', 'Only HR / admin can list all goals', 403, correlationId);
  }
  if (scope === 'mine' && !employeeId) {
    return successResponse([], correlationId);
  }

  // HR querying a specific employee — narrow to that. Otherwise scope=all
  // returns everyone's, scope=mine returns the caller's.
  const where: any = {};
  if (scope === 'mine') where.employeeId = employeeId;
  if (parsed.data.employeeId && hr) where.employeeId = parsed.data.employeeId;
  if (parsed.data.status) where.status = parsed.data.status;

  try {
    const goals = await prisma.performanceGoal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:    { select: { id: true, name: true, email: true } },
      },
    });

    // Stamp OVERDUE on the fly for active goals past their due date so
    // the UI doesn't have to compute it. We don't persist the flip —
    // marking OVERDUE explicitly is the user's call (they may still be
    // working on it past the date).
    const now = new Date();
    const decorated = goals.map(g => ({
      ...g,
      isOverdue: g.status === 'ACTIVE' && !!g.dueDate && g.dueDate < now,
    }));

    return successResponse(decorated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list goals';
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

  // Target employee resolution. If body.employeeId is set, only HR can
  // create goals for someone else. Otherwise default to the caller's.
  const targetEmployeeId = parsed.data.employeeId ?? session.user.employeeId;
  if (!targetEmployeeId) {
    return errorResponse(
      'NO_EMPLOYEE',
      'Your account is not linked to an employee record',
      400,
      correlationId,
    );
  }
  const isSelf = targetEmployeeId === session.user.employeeId;
  if (!isSelf && !isHR(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'Only HR can create goals for other employees',
      403,
      correlationId,
    );
  }

  try {
    const goal = await prisma.performanceGoal.create({
      data: {
        employeeId:      targetEmployeeId,
        ownerId:         session.user.id,
        title:           parsed.data.title,
        description:     parsed.data.description ?? null,
        category:        parsed.data.category ?? 'INDIVIDUAL',
        dueDate:         parsed.data.dueDate ?? null,
        status:          parsed.data.status ?? 'ACTIVE',
        progressPercent: parsed.data.progressPercent ?? 0,
        notes:           parsed.data.notes ?? null,
      },
      include: {
        employee: { select: { id: true, staffId: true, firstName: true, lastName: true, jobTitle: true } },
        owner:    { select: { id: true, name: true, email: true } },
      },
    });
    return successResponse(goal, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create goal';
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
