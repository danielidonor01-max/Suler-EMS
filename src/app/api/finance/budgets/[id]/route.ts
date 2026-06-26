import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getBudget, activateBudget, closeBudget } from '@/modules/finance/domain/budget.service';

/**
 * GET   /api/finance/budgets/[id]  — read with categories + utilization.
 * PATCH /api/finance/budgets/[id]  — state transition only.
 *
 *   action = ACTIVATE → DRAFT to ACTIVE  (requires finance:allocate)
 *   action = CLOSE    → ACTIVE to CLOSED (requires finance:allocate)
 *
 * Both transitions are state-guarded inside the service via updateMany
 * so a concurrent retry can't trample the approver attribution.
 */

const PatchSchema = z.object({
  action: z.enum(['ACTIVATE', 'CLOSE']),
});

function canAllocate(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN') return true;
  return (session.user.permissions ?? []).includes('finance:allocate');
}

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

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  const { id } = (await context.params) as { id: string };

  if (!canAllocate(session as any)) {
    return errorResponse('FORBIDDEN', 'finance:allocate required', 403, correlationId);
  }

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const result = parsed.data.action === 'ACTIVATE'
      ? await activateBudget(id, session.user.id)
      : await closeBudget(id);
    return successResponse(result, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to transition budget';
    if (msg.includes('not in DRAFT') || msg.includes('not ACTIVE')) {
      return errorResponse('INVALID_STATE', msg, 409, correlationId);
    }
    if (msg.includes('No record')) {
      return errorResponse('NOT_FOUND', 'Budget not found', 404, correlationId);
    }
    return errorResponse('TRANSITION_FAILED', msg, 500, correlationId);
  }
});
