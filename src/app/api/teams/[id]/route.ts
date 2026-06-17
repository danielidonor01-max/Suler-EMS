import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/teams/[id] — update or delete a single team.
 *
 *   PATCH  — settings:manage. Partial update. Code is immutable.
 *   DELETE — settings:manage. Cascades memberships (the FK has ON DELETE
 *            CASCADE), so a team can always be removed safely without
 *            asking the admin to detach members first.
 */

const PatchSchema = z.object({
  name:         z.string().min(2).max(120).optional(),
  description:  z.string().max(500).nullable().optional(),
  status:       z.enum(['ACTIVE', 'INACTIVE']).optional(),
  hubId:        z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  managerId:    z.string().uuid().nullable().optional(),
});

function requireSettingsManage(perms: string[]): boolean {
  return perms.includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to edit teams', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const team = await prisma.team.update({ where: { id }, data: parsed.data });
    return successResponse(team, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update team';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Team not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!requireSettingsManage(session.user.permissions ?? [])) {
    return errorResponse('FORBIDDEN', 'settings:manage required to delete teams', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    await prisma.team.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete team';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Team not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
