import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/work-sites/[id]
 *
 *   PATCH  — edit. HR / SUPER_ADMIN / settings:manage.
 *   DELETE — soft delete via isActive=false. Hard delete would null out
 *            historical AttendanceRecord.checkInSiteId FKs (we use SET
 *            NULL) but the lat/lng/distance columns preserve the audit
 *            of where someone was. Soft delete keeps the human-readable
 *            site name attached to history.
 */

const PatchSchema = z.object({
  name:         z.string().min(2).max(120).optional(),
  address:      z.string().max(300).nullable().optional(),
  lat:          z.number().min(-90).max(90).optional(),
  lng:          z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().positive().max(10_000).optional(),
  hubId:        z.string().uuid().nullable().optional(),
  isActive:     z.boolean().optional(),
});

function canManage(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  return (session.user.permissions ?? []).includes('settings:manage');
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!canManage(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / SUPER_ADMIN required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const updated = await prisma.workSite.update({
      where: { id },
      data:  parsed.data,
      include: { hub: { select: { id: true, name: true, code: true } } },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Site not found', 404, correlationId);
    }
    if (msg.includes('Unique constraint')) {
      return errorResponse('DUPLICATE_NAME', 'A site with that name already exists', 409, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!canManage(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / SUPER_ADMIN required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };

  try {
    // Soft delete: keeps historical attendance rows readable. Hard
    // delete is intentionally unavailable; HR can re-activate by PATCH.
    const updated = await prisma.workSite.update({
      where: { id },
      data:  { isActive: false },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Site not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
