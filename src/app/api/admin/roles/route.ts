import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listRoles } from '@/modules/admin/domain/role.service';

/**
 * GET /api/admin/roles — list all roles + their permissions + user counts.
 * Requires `role:manage` (or SUPER_ADMIN).
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  const roles = await listRoles();
  return successResponse(roles, correlationId);
});
