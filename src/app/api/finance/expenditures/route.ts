import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  submitExpenditure,
  listExpenditures,
  ExpenditureError,
  ExpenditureStatus,
} from '@/modules/finance/domain/expenditure.service';

const SubmitSchema = z.object({
  budgetId: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().min(3).max(500),
  vendor: z.string().max(120).optional(),
  reference: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const ListQuerySchema = z.object({
  scope: z.enum(['mine', 'team', 'all']).optional().default('mine'),
  status: z.string().optional(),
  budgetId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * GET /api/finance/expenditures?scope=mine|team|all&status=SUBMITTED,APPROVED&budgetId=...
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const { scope, status, budgetId, limit } = parsed.data;
  const states = status ? (status.split(',') as ExpenditureStatus[]) : undefined;

  let requesterId: string | undefined;
  if (scope === 'mine') {
    requesterId = session.user.employeeId;
    if (!requesterId) {
      return errorResponse('NO_EMPLOYEE', 'Calling user not linked to an employee', 400, correlationId);
    }
  } else if (scope === 'team') {
    // Finance Managers + Super Admin see the approval queue. HR has no finance scope.
    if (!['FINANCE_MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return errorResponse('FORBIDDEN', 'Finance role required for team scope', 403, correlationId);
    }
  } else {
    if (session.user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'SUPER_ADMIN required for full scope', 403, correlationId);
    }
  }

  const rows = await listExpenditures({ requesterId, states, budgetId, limit });
  return successResponse(rows, correlationId);
});

/**
 * POST /api/finance/expenditures — submit a new expenditure on behalf of the
 * authenticated user. Amount is immutable from this point (Constraint #3).
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const result = await submitExpenditure({
      ...parsed.data,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
        employeeId: session.user.employeeId,
      },
    });
    return successResponse(result, correlationId, 201);
  } catch (err) {
    if (err instanceof ExpenditureError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('SUBMIT_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
