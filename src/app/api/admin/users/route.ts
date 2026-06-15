import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { listAdminUsers } from '@/modules/admin/domain/user.service';

const ListQuerySchema = z.object({
  roleId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * GET /api/admin/users?roleId=&isActive=&search=&limit=
 * Requires role:manage. Returns users with role + employee summary.
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('role:manage') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'role:manage required', 403, correlationId);
  }
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  const { isActive, ...rest } = parsed.data;
  const users = await listAdminUsers({
    ...rest,
    ...(isActive ? { isActive: isActive === 'true' } : {}),
  });
  return successResponse(users, correlationId);
});
