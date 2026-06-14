import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { createDraftRun, listRuns, PayrollError } from '@/modules/payroll/domain/payroll.service';
import type { PayrollRunStatus } from '@/modules/payroll/domain/types';

const CreateRunSchema = z.object({
  name: z.string().min(2).max(120),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM'),
  departmentId: z.string().nullable().optional(),
});

const ListQuerySchema = z.object({
  period: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PROCESSED', 'CANCELLED']).optional(),
  departmentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/payroll/runs?period=2026-07&status=PROCESSED
 * Restricted to roles with payroll:view.
 */
export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!(session.user.permissions ?? []).includes('payroll:view') && session.user.role !== 'SUPER_ADMIN') {
    return errorResponse('FORBIDDEN', 'payroll:view required', 403, correlationId);
  }
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }
  const rows = await listRuns(parsed.data as any);
  return successResponse(rows, correlationId);
});

/**
 * POST /api/payroll/runs — create a draft run for the given period/department.
 * Snapshots salary structures + applicable pending adjustments into immutable
 * PayrollEntry rows (ARCHITECTURE.md §5).
 */
export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  const body = await req.json();
  const parsed = CreateRunSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const run = await createDraftRun({
      ...parsed.data,
      actor: {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? 'Unknown',
        role: session.user.role,
        permissions: session.user.permissions ?? [],
        employeeId: session.user.employeeId,
      },
    });
    return successResponse(run, correlationId, 201);
  } catch (err) {
    if (err instanceof PayrollError) {
      return errorResponse(err.code, err.message, err.httpStatus, correlationId);
    }
    return errorResponse('CREATE_FAILED', err instanceof Error ? err.message : 'Failed', 400, correlationId);
  }
});
