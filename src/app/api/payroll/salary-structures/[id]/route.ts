import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/payroll/salary-structures/[id]
 *
 *   PATCH  — edit a salary structure. Only inactive rows can have their
 *            amounts revised (we don't want to silently rewrite the
 *            active structure that's about to feed a payroll run); the
 *            active row can have its effectiveDate / reason adjusted.
 *   DELETE — only allowed on inactive rows that have no associated
 *            PayrollEntry rows referencing them.
 *
 * Finance / HR / SUPER_ADMIN only.
 */

const PatchSchema = z.object({
  effectiveDate:      z.coerce.date().optional(),
  basicSalary:        z.number().positive().optional(),
  housingAllowance:   z.number().nonnegative().optional(),
  transportAllowance: z.number().nonnegative().optional(),
  otherAllowances: z.array(z.object({
    name: z.string().min(1).max(80), amount: z.number().nonnegative(), taxable: z.boolean(),
  })).max(20).optional(),
  reason: z.string().max(300).optional().nullable(),
});

function isFinanceOrHR(role: string): boolean {
  return ['FINANCE_MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role);
}

export const PATCH = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isFinanceOrHR(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const existing = await prisma.salaryStructure.findUniqueOrThrow({ where: { id } });

    // Active rows: only allow effectiveDate / reason changes. Anything
    // else creates a misleading audit trail because we'd be changing
    // the very row that's about to fund a run.
    if (existing.isActive) {
      const onlySafeFields = !('basicSalary' in parsed.data)
        && !('housingAllowance' in parsed.data)
        && !('transportAllowance' in parsed.data)
        && !('otherAllowances' in parsed.data);
      if (!onlySafeFields) {
        return errorResponse(
          'IMMUTABLE_ACTIVE',
          'Active salary structures cannot have amounts changed — create a new structure instead.',
          409,
          correlationId,
        );
      }
    }

    const updated = await prisma.salaryStructure.update({
      where: { id },
      data: {
        ...(parsed.data.effectiveDate !== undefined ? { effectiveDate: parsed.data.effectiveDate } : {}),
        ...(parsed.data.basicSalary !== undefined ? { basicSalary: parsed.data.basicSalary } : {}),
        ...(parsed.data.housingAllowance !== undefined ? { housingAllowance: parsed.data.housingAllowance } : {}),
        ...(parsed.data.transportAllowance !== undefined ? { transportAllowance: parsed.data.transportAllowance } : {}),
        ...(parsed.data.otherAllowances !== undefined ? { otherAllowances: parsed.data.otherAllowances as any } : {}),
        ...(parsed.data.reason !== undefined ? { reason: parsed.data.reason } : {}),
      },
    });
    return successResponse(updated, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update salary structure';
    if (msg.includes('Record to update not found')) {
      return errorResponse('NOT_FOUND', 'Salary structure not found', 404, correlationId);
    }
    return errorResponse('UPDATE_FAILED', msg, 500, correlationId);
  }
});

export const DELETE = withAuth(async (_req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isFinanceOrHR(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  try {
    const existing = await prisma.salaryStructure.findUniqueOrThrow({ where: { id } });
    if (existing.isActive) {
      return errorResponse('IMMUTABLE_ACTIVE', 'Cannot delete the active salary structure', 409, correlationId);
    }
    // SalaryStructure isn't FK'd from PayrollEntry (entries snapshot
    // values, they don't reference the structure row), so deletion is
    // safe by definition once isActive=false.
    await prisma.salaryStructure.delete({ where: { id } });
    return successResponse({ ok: true }, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete salary structure';
    if (msg.includes('Record to delete does not exist')) {
      return errorResponse('NOT_FOUND', 'Salary structure not found', 404, correlationId);
    }
    return errorResponse('DELETE_FAILED', msg, 500, correlationId);
  }
});
