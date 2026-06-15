import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  transitionExpenditure,
  ExpenditureError,
} from '@/modules/finance/domain/expenditure.service';

const TransitionSchema = z.object({
  action: z.enum(['SUBMIT', 'APPROVE_FINANCE', 'REJECT_FINANCE', 'DISBURSE', 'CANCEL']),
  comment: z.string().max(500).optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'CARD']).optional(),
});

/**
 * PATCH /api/finance/expenditures/[id]/transition
 *
 * Single transition entry point. The workflow engine enforces state + role +
 * permission. The service enforces:
 *   - Budget balance before DISBURSE (409 BUDGET_EXCEEDED)
 *   - CANCEL only by requester or Finance
 *   - DISBURSED is terminal (defined in workflow — has no exits)
 */
export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const result = await transitionExpenditure({
      expenditureId: id,
      action: parsed.data.action,
      comment: parsed.data.comment,
      paymentMethod: parsed.data.paymentMethod,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
        employeeId: session.user.employeeId,
      },
    });
    return successResponse(result, correlationId);
  } catch (err) {
    if (err instanceof ExpenditureError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('TRANSITION_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
