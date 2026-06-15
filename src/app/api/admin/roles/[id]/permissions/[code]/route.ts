import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { grantPermission, revokePermission, RoleError } from '@/modules/admin/domain/role.service';

/**
 * POST /api/admin/roles/[id]/permissions/[code] — grant
 * DELETE /api/admin/roles/[id]/permissions/[code] — revoke
 *
 * Both are atomic with audit entries + User.version bump (ARCHITECTURE.md §11).
 * DELETE enforces C3 (self-lockout prevention) and C4 (platform lockout).
 */
function buildActor(session: any) {
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? 'Unknown',
    role: session.user.role,
    permissions: session.user.permissions ?? [],
  };
}

function requireAuth(session: any, correlationId: string) {
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  return null;
}

export const POST = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const guard = requireAuth(session, correlationId);
  if (guard) return guard;
  const { id, code } = (await context.params) as { id: string; code: string };
  try {
    return successResponse(await grantPermission(id, code, buildActor(session)), correlationId);
  } catch (err) {
    if (err instanceof RoleError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('GRANT_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const guard = requireAuth(session, correlationId);
  if (guard) return guard;
  const { id, code } = (await context.params) as { id: string; code: string };
  try {
    return successResponse(await revokePermission(id, code, buildActor(session)), correlationId);
  } catch (err) {
    if (err instanceof RoleError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('REVOKE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
