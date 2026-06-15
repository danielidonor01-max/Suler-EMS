import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { createBudget, listBudgets } from '@/modules/finance/domain/budget.service';

const ListQuerySchema = z.object({
  fiscalYear: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  departmentId: z.string().optional(),
  includeUtilization: z.coerce.boolean().optional().default(true),
});

const CreateBudgetSchema = z.object({
  name: z.string().min(2).max(120),
  fiscalYear: z.string().min(2).max(20),
  period: z.enum(['ANNUAL', 'Q1', 'Q2', 'Q3', 'Q4', 'MONTHLY']),
  departmentId: z.string().nullable().optional(),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
  categories: z.array(z.object({
    name: z.string().min(2).max(80),
    allocatedAmount: z.number().nonnegative(),
    code: z.string().max(20).optional(),
  })).optional(),
});

/**
 * GET /api/finance/budgets?fiscalYear=FY2026&status=ACTIVE&includeUtilization=true
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  if (!(session.user.permissions ?? []).includes('finance:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'finance:view required', 403, correlationId);
  }

  const budgets = await listBudgets(parsed.data);
  return successResponse(budgets, correlationId);
});

/**
 * POST /api/finance/budgets — create (DRAFT). Activation is a separate step.
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = CreateBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  if (!(session.user.permissions ?? []).includes('finance:allocate') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'finance:allocate required', 403, correlationId);
  }

  try {
    const budget = await createBudget({ ...parsed.data, createdById: session.user.id });
    return successResponse(budget, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create budget';
    return errorResponse('CREATE_FAILED', msg, 400, correlationId);
  }
});
