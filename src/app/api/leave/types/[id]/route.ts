import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/leave/types/[id] — update or delete a single leave type.
 *
 *   PATCH  — settings:manage. Code is immutable post-create (historical
 *            LeaveRequest rows carry this code as a snapshot string and
 *            renaming would break the relationship).
 *   DELETE — settings:manage. Prefer setting isActive=false via PATCH if
 *            any historical leave requests reference this type. The
 *            DELETE here is intended for typos / never-used categories.
 */

const PatchSchema = z.object({
  name:        z.string().min(2).max(80).optional(),
  quotaDays:   z.coerce.number().int().min(0).max(365).optional(),
  description: z.string().max(500).nullable().optional(),
  color:       z.string().max(20).nullable().optional(),
  isActive:    z.boolean().optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to edit leave types', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const updated = await prisma.leaveType.update({
      where: { id },
      data:  parsed.data,
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update leave type';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A leave type with that name already exists', 409, correlationId);
    }
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Leave type not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to delete leave types', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    // Sanity check: refuse delete if leave requests reference this type's
    // code. The code is stored as a string snapshot on LeaveRequest, so a
    // type code that's already been used is effectively immutable history.
    const target = await prisma.leaveType.findUnique({ where: { id }, select: { code: true } });
    if (!target) {
      return errorResponse('NOT_FOUND', 'Leave type not found', 404, correlationId);
    }
    const used = await prisma.leaveRequest.count({ where: { type: target.code } });
    if (used > 0) {
      return errorResponse(
        'HAS_DEPENDENTS',
        `Cannot delete: ${used} historical leave request(s) reference this type. Disable it via the active toggle instead.`,
        409,
        correlationId,
      );
    }

    await prisma.leaveType.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete leave type';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Leave type not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
