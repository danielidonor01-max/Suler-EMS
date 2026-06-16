import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/departments — functional units (Operations, Finance, HR, …).
 *
 *   GET  — list with derived counts and nested manager + hub objects.
 *          Any authenticated user.
 *   POST — settings:manage. Create a new department under a hub.
 *
 * Per-id update/delete in [id]/route.ts.
 */

const CreateSchema = z.object({
  code:          z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/i),
  name:          z.string().min(2).max(80),
  reportingLine: z.string().max(80).optional().nullable(),
  managerId:     z.string().uuid().optional().nullable(),
  hubId:         z.string().uuid().optional().nullable(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  try {
    const rows = await prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        hub:     { select: { id: true, code: true, name: true } },
        _count:  { select: { employees: true } },
      },
    });

    const data = rows.map(d => ({
      id:            d.id,
      code:          d.code,
      name:          d.name,
      reportingLine: d.reportingLine,
      manager:       d.manager
        ? { id: d.manager.id, name: `${d.manager.firstName} ${d.manager.lastName}`, jobTitle: d.manager.jobTitle }
        : null,
      managerId:     d.managerId,
      hub:           d.hub,
      hubId:         d.hubId,
      staff:         d._count.employees,
      createdAt:     d.createdAt,
      updatedAt:     d.updatedAt,
    }));

    return successResponse(data, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list departments';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to create departments', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const dept = await prisma.department.create({
      data: {
        code:          parsed.data.code.toUpperCase(),
        name:          parsed.data.name,
        reportingLine: parsed.data.reportingLine ?? null,
        managerId:     parsed.data.managerId ?? null,
        hubId:         parsed.data.hubId ?? null,
      },
    });
    return successResponse(dept, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create department';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A department with that code or name already exists', 409, correlationId);
    }
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
