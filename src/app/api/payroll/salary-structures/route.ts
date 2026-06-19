import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * /api/payroll/salary-structures
 *
 *   GET  — list. Required: employeeId. Returns history for that employee.
 *   POST — create new salary structure. Deactivates the prior active one
 *          atomically so the (employeeId, isActive=true) invariant holds.
 *
 * Authorization: FINANCE_MANAGER / HR_ADMIN / SUPER_ADMIN. Employees can
 * read their own (handled via a separate /me-style endpoint if/when needed
 * — for now, listing requires admin since salary data is sensitive).
 */

const AllowanceSchema = z.object({
  name:    z.string().min(1).max(80),
  amount:  z.number().nonnegative(),
  taxable: z.boolean(),
});

const CreateSchema = z.object({
  employeeId:         z.string().uuid(),
  effectiveDate:      z.coerce.date(),
  basicSalary:        z.number().positive(),
  housingAllowance:   z.number().nonnegative().default(0),
  transportAllowance: z.number().nonnegative().default(0),
  otherAllowances:    z.array(AllowanceSchema).max(20).optional(),
  reason:             z.string().max(300).optional().nullable(),
});

function isFinanceOrHR(role: string): boolean {
  return ['FINANCE_MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(role);
}

export const GET = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!isFinanceOrHR(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');
  if (!employeeId) {
    return errorResponse('VALIDATION_ERROR', 'employeeId is required', 400, correlationId);
  }

  try {
    const rows = await prisma.salaryStructure.findMany({
      where: { employeeId },
      orderBy: [{ isActive: 'desc' }, { effectiveDate: 'desc' }],
      take: 50,
    });
    return successResponse(rows, correlationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list salary structures';
    return errorResponse('LIST_FAILED', msg, 500, correlationId);
  }
});

export const POST = withAuth(async (req, session) => {
  const correlationId = crypto.randomUUID();
  if (!isFinanceOrHR(session.user.role)) {
    return errorResponse('FORBIDDEN', 'Finance / HR / SUPER_ADMIN required', 403, correlationId);
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  // Deactivate prior + create new in a single transaction so the
  // "one active per employee" invariant survives concurrent writes.
  try {
    const created = await prisma.$transaction(async (tx) => {
      await tx.salaryStructure.updateMany({
        where: { employeeId: parsed.data.employeeId, isActive: true },
        data:  { isActive: false },
      });

      return tx.salaryStructure.create({
        data: {
          employeeId:         parsed.data.employeeId,
          effectiveDate:      parsed.data.effectiveDate,
          basicSalary:        parsed.data.basicSalary,
          housingAllowance:   parsed.data.housingAllowance,
          transportAllowance: parsed.data.transportAllowance,
          otherAllowances:    (parsed.data.otherAllowances ?? null) as any,
          isActive:           true,
          changedById:        session.user.id,
          reason:             parsed.data.reason ?? null,
        },
      });
    });

    return successResponse(created, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create salary structure';
    return errorResponse('CREATE_FAILED', msg, 500, correlationId);
  }
});
