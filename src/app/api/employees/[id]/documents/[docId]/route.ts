import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * DELETE /api/employees/[id]/documents/[docId]
 *
 * HR / SUPER_ADMIN / hr:edit / settings:manage only. Hard-deletes the
 * row + payload from Postgres. No soft-delete because document retention
 * is a legal call HR should make explicitly via the upload date and
 * description; if you need archival, copy out via /download first.
 */

function canManageDocs(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id, docId } = (await context.params) as { id: string; docId: string };

  if (!canManageDocs(session as any)) {
    return errorResponse(
      'FORBIDDEN',
      'hr:edit or settings:manage required to delete documents',
      403,
      correlationId,
    );
  }

  try {
    // Scope the delete to the employee so a wrong-URL docId can't be
    // hijacked by chaining two routes — the where clause enforces the
    // pair must match.
    const result = await prisma.employeeDocument.deleteMany({
      where: { id: docId, employeeId: id },
    });
    if (result.count === 0) {
      return errorResponse('NOT_FOUND', 'Document not found', 404, correlationId);
    }
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete document';
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
