import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import {
  createAdjustment, listAdjustments, AdjustmentError,
} from '@/modules/payroll/domain/adjustment.service';

const CreateSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['BONUS', 'DEDUCTION', 'REIMBURSEMENT', 'OVERTIME', 'ADVANCE', 'COMMISSION']),
  amount: z.number().positive(),
  reason: z.string().min(3).max(300),
  effectivePeriod: z.string().regex(/^\d{4}-\d{2}$/),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const ListQuerySchema = z.object({
  employeeId: z.string().optional(),
  period: z.string().optional(),
  status: z.enum(['PENDING', 'APPLIED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * GET /api/payroll/adjustments
 * Finance + SUPER_ADMIN see all; others only their own.
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  const isFinance = ['FINANCE_MANAGER', 'SUPER_ADMIN', 'HR_ADMIN'].includes(session.user.role);
  const filter = { ...parsed.data };
  if (!isFinance) {
    if (!session.user.employeeId) {
      return errorResponse('NO_EMPLOYEE', 'Calling user not linked to an employee', 400, correlationId);
    }
    filter.employeeId = session.user.employeeId;
  }

  const rows = await listAdjustments(filter as any);
  return successResponse(rows, correlationId);
});

/**
 * POST /api/payroll/adjustments — only Finance / HR / SUPER_ADMIN can create.
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!['FINANCE_MANAGER', 'SUPER_ADMIN', 'HR_ADMIN'].includes(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  try {
    const adj = await createAdjustment({ ...parsed.data, createdById: session.user.id });
    return successResponse(adj, correlationId, 201);
  } catch (err) {
    if (err instanceof AdjustmentError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('CREATE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
