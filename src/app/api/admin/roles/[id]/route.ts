import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getRole, deleteRole, RoleError } from '@/modules/admin/domain/role.service';

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };
  try {
    return successResponse(await getRole(id), correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Role not found', 404, correlationId);
  }
});

/**
 * DELETE /api/admin/roles/[id] — protected by C1 (no system role deletion)
 * and ROLE_IN_USE (must reassign users first).
 */
export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };
  try {
    return successResponse(await deleteRole(id), correlationId);
  } catch (err) {
    if (err instanceof RoleError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('DELETE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
