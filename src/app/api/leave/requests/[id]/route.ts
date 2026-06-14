import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getLeaveRequest } from '@/modules/leave/domain/leave.service';

/**
 * GET /api/leave/requests/[id]?includeHistory=true
 *
 * Returns the leave request. Audit history is opt-in via query param so list
 * views stay light. Authorization: the requester themselves OR anyone with
 * leave:view permission (MANAGER / HR / SUPER_ADMIN per seed).
 */
export const GET = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };
  const includeHistory = new URL(req.url).searchParams.get('includeHistory') === 'true';

  try {
    const request = await getLeaveRequest(id, { includeHistory });

    const isOwner = request.employee.id === session.user.employeeId;
    const canViewAll = ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!isOwner && !canViewAll) {
      return errorResponse('FORBIDDEN', 'You do not have access to this leave request', 403, correlationId);
    }

    return successResponse(request, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Leave request not found';
    return errorResponse('NOT_FOUND', msg, 404, correlationId);
  }
});
