import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getRole, deleteRole, updateRole, RoleError } from '@/modules/admin/domain/role.service';

const UpdateRoleSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  description: z.string().max(200).nullable().optional(),
});

function requireRoleManage(session: any, correlationId: string) {
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  return null;
}

export const GET = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const guard = requireRoleManage(session, correlationId);
  if (guard) return guard;
  const { id } = (await context.params) as { id: string };
  try {
    return successResponse(await getRole(id), correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Role not found', 404, correlationId);
  }
});

/**
 * PATCH /api/admin/roles/[id] — rename / re-describe.
 * System role names are immutable (C1); description can be edited.
 */
export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const guard = requireRoleManage(session, correlationId);
  if (guard) return guard;
  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  try {
    const updated = await updateRole(id, parsed.data, {
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
    return errorResponse('UPDATE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});

/**
 * DELETE /api/admin/roles/[id] — protected by C1 (no system role deletion)
 * and ROLE_IN_USE (must reassign users first).
 */
export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  const guard = requireRoleManage(session, correlationId);
  if (guard) return guard;
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
