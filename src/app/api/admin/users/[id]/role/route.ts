import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { changeUserRole, RoleError } from '@/modules/admin/domain/role.service';

const BodySchema = z.object({
  roleId: z.string().min(1),
});

/**
 * PATCH /api/admin/users/[id]/role
 *
 * Reassign a user to a different role. Requires `role:manage`.
 *
 * Enforces Phase 6 C4 — the last active SUPER_ADMIN cannot be demoted.
 * Audit (SystemEvent + SecurityEvent) and User.version bump happen
 * atomically inside the service.
 */
export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  try {
    const updated = await changeUserRole(id, parsed.data.roleId, {
      id: session.user.id,
      name: session.user.name ?? session.user.email ?? 'Unknown',
      role: session.user.role,
      permissions: session.user.permissions ?? [],
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    if (err instanceof RoleError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('ROLE_CHANGE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
