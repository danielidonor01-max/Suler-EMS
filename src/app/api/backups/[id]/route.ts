import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * DELETE /api/backups/[id]
 *
 * Permanently removes a backup row + its payload. SUPER_ADMIN /
 * settings:manage / data:manage only. Hard delete — backups are
 * archival artifacts that admins should download for off-site
 * storage if they need retention beyond the in-DB copy.
 */

function canManageBackups(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('settings:manage') || perms.includes('data:manage');
}

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();

  if (!canManageBackups(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'settings:manage or data:manage required to delete backups',
      403,
      correlationId,
    );
  }

  const { id } = (await context.params) as { id: string };

  try {
    await prisma.backup.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete backup';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Backup not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
