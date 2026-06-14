import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getExpenditure } from '@/modules/finance/domain/expenditure.service';

/**
 * GET /api/finance/expenditures/[id]?includeHistory=true
 *
 * Authorization: requester themselves, finance role, or audit:view.
 */
export const GET = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };
  const includeHistory = new URL(req.url).searchParams.get('includeHistory') === 'true';

  try {
    const expenditure = await getExpenditure(id, { includeHistory });

    const isRequester = expenditure.requestedBy.id === session.user.employeeId;
    const canViewAll =
      ['FINANCE_MANAGER', 'SUPER_ADMIN'].includes(session.user.role) ||
      (session.user.permissions ?? []).includes('audit:view');
    if (!isRequester && !canViewAll) {
      return errorResponse('FORBIDDEN', 'You do not have access to this expenditure', 403, correlationId);
    }

    return successResponse(expenditure, correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Not found', 404, correlationId);
  }
});
