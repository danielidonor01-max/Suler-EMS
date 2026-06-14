import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { transitionRun, PayrollError } from '@/modules/payroll/domain/payroll.service';

const TransitionSchema = z.object({
  action: z.enum(['SUBMIT_FOR_REVIEW', 'RETURN_TO_DRAFT', 'APPROVE', 'REJECT', 'PROCESS', 'CANCEL']),
  comment: z.string().max(500).optional(),
});

/**
 * PATCH /api/payroll/runs/[id]/transition
 *
 *   Constraints enforced:
 *     - Workflow definition (PayrollRunWorkflow) — state + role + permission
 *     - Reconciliation: PayrollRun totals ≡ Σ(entries) before PROCESS (409 RECONCILIATION_FAILED)
 *     - Idempotent PROCESS — `updateMany` guard returns 409 ALREADY_PROCESSED on race
 *     - PROCESSED is terminal — workflow definition rejects further actions
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
    const result = await transitionRun(id, parsed.data.action, {
      id: session.user.id,
      name: session.user.name ?? session.user.email ?? 'Unknown',
      role: session.user.role,
      permissions: session.user.permissions ?? [],
      employeeId: session.user.employeeId,
    }, parsed.data.comment);
    return successResponse(result, correlationId);
  } catch (err) {
    if (err instanceof PayrollError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('TRANSITION_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
