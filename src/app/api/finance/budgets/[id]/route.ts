import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getBudget } from '@/modules/finance/domain/budget.service';

/**
 * GET /api/finance/budgets/[id]
 * Returns the budget with categories and utilization.
 */
export const GET = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  if (!(session.user.permissions ?? []).includes('finance:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'finance:view required', 403, correlationId);
  }

  try {
    const budget = await getBudget(id);
    return successResponse(budget, correlationId);
  } catch (err) {
    return errorResponse('NOT_FOUND', err instanceof Error ? err.message : 'Budget not found', 404, correlationId);
  }
});
