import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { cancelAdjustment, AdjustmentError } from '@/modules/payroll/domain/adjustment.service';

/**
 * DELETE /api/payroll/adjustments/[id]
 * Cancels a PENDING adjustment. APPLIED ones are immutable (Constraint §5 +
 * Phase 5 design — once a payroll run consumes an adjustment, it's locked).
 */
export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!['FINANCE_MANAGER', 'SUPER_ADMIN', 'HR_ADMIN'].includes(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }
  const { id } = (await context.params) as { id: string };
  try {
    const adj = await cancelAdjustment(id);
    return successResponse(adj, correlationId);
  } catch (err) {
    if (err instanceof AdjustmentError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('CANCEL_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
