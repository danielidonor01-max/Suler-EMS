import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/departments/[id] — update or delete a single department.
 *
 *   PATCH  — settings:manage. Code immutable post-create.
 *   DELETE — settings:manage. Blocks if employees still attached.
 */

const PatchSchema = z.object({
  name:          z.string().min(2).max(80).optional(),
  reportingLine: z.string().max(80).nullable().optional(),
  managerId:     z.string().uuid().nullable().optional(),
  hubId:         z.string().uuid().nullable().optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to edit departments', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const dept = await prisma.department.update({
      where: { id },
      data: parsed.data,
    });
    return successResponse(dept, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update department';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A department with that name already exists', 409, correlationId);
    }
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Department not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to delete departments', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    // Guard: refuse delete if employees still attached. Cascading would
    // detach employees from their department, leaving them in a broken
    // state for payroll runs and leave approvals.
    const blocked = await prisma.employee.count({ where: { departmentId: id } });
    if (blocked > 0) {
      return errorResponse(
        'HAS_DEPENDENTS',
        `Cannot delete: ${blocked} employee(s) still in this department. Reassign them first.`,
        409,
        correlationId,
      );
    }

    await prisma.department.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete department';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Department not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
