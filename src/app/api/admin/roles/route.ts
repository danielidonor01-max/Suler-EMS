import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listRoles, createRole, RoleError } from '@/modules/admin/domain/role.service';

const CreateRoleSchema = z.object({
  name: z.string().min(2).max(40),
  description: z.string().max(200).optional(),
});

function requireRoleManage(session: any, correlationId: string) {
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  return null;
}

/**
 * GET /api/admin/roles — list all roles + their permissions + user counts.
 */
export const GET = withAuth(async (_req, session) => {
  const correlationId = crypto.randomUUID();
  const guard = requireRoleManage(session, correlationId);
  if (guard) return guard;
  return successResponse(await listRoles(), correlationId);
});

/**
 * POST /api/admin/roles — create a custom role (starts with zero permissions).
 * System role names are reserved.
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const guard = requireRoleManage(session, correlationId);
  if (guard) return guard;
  const body = await req.json();
  const parsed = CreateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  try {
    const role = await createRole(parsed.data, {
      id: session.user.id,
      name: session.user.name ?? session.user.email ?? 'Unknown',
      role: session.user.role,
      permissions: session.user.permissions ?? [],
    });
    return successResponse(role, correlationId, 201);
  } catch (err) {
    if (err instanceof RoleError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('CREATE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
