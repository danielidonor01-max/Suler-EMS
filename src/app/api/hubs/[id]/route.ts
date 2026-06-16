import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/hubs/[id] — update or delete a single hub.
 *
 *   PATCH  — settings:manage. Partial update of name/geography/category/
 *            status/managerId. Hub code is immutable post-create (changing
 *            it would break any cached references in the UI).
 *
 *   DELETE — settings:manage. Soft check first: cannot delete a hub that
 *            still has departments attached. UI prompts the admin to
 *            either reassign or delete those departments first.
 */

const PatchSchema = z.object({
  name:       z.string().min(2).max(80).optional(),
  geography:  z.string().min(2).max(120).optional(),
  category:   z.string().min(2).max(60).optional(),
  status:     z.enum(['ACTIVE', 'INITIALIZING', 'INACTIVE']).optional(),
  managerId:  z.string().uuid().nullable().optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to edit hubs', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const hub = await prisma.hub.update({
      where: { id },
      data: parsed.data,
    });
    return successResponse(hub, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update hub';
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE', 'A hub with that name already exists', 409, correlationId);
    }
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Hub not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to delete hubs', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    // Guard: refuse delete if departments still attached. The Department
    // FK is ON DELETE SET NULL so a delete WOULD succeed and leave orphans,
    // but that's confusing for an admin who didn't realize the link existed.
    const blocked = await prisma.department.count({ where: { hubId: id } });
    if (blocked > 0) {
      return errorResponse(
        'HAS_DEPENDENTS',
        `Cannot delete: ${blocked} department(s) still attached to this hub. Reassign or delete them first.`,
        409,
        correlationId,
      );
    }

    await prisma.hub.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete hub';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Hub not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
