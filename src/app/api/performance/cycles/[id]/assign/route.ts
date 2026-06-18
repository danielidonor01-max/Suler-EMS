import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/performance/cycles/[id]/assign
 *
 * Bulk-creates review rows for every active employee in the cycle.
 * HR can supply explicit (employeeId, reviewerId) pairs OR set
 * `assignAll=true` to enrol every active employee with no reviewer
 * (HR can fill those in later from the cycle detail view).
 *
 * Idempotent: existing reviews for (cycleId, employeeId) are left
 * alone, so re-running the assign after onboarding new employees
 * just tops up the missing rows.
 */

const PairSchema = z.object({
  employeeId: z.string().uuid(),
  reviewerId: z.string().uuid().optional().nullable(),
});

const AssignSchema = z.union([
  z.object({ assignAll: z.literal(true), reviewerId: z.string().uuid().optional().nullable() }),
  z.object({ pairs: z.array(PairSchema).min(1).max(500) }),
]);

function isHR(session: { user: { role: string; permissions?: string[] } }): boolean {
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'HR_ADMIN') return true;
  const perms = session.user.permissions ?? [];
  return perms.includes('hr:edit') || perms.includes('settings:manage');
}

export const POST = withAuth(async (req, session, context) => {
  const correlationId = crypto.randomUUID();
  if (!isHR(session as any)) {
    return errorResponse('FORBIDDEN', 'HR / admin required', 403, correlationId);
  }

  const { id } = (await context.params) as { id: string };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Expected JSON body', 400, correlationId);
  }

  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message, 400, correlationId);
  }

  try {
    const cycle = await prisma.reviewCycle.findUniqueOrThrow({ where: { id } });

    let pairs: Array<{ employeeId: string; reviewerId: string | null }>;
    if ('assignAll' in parsed.data && parsed.data.assignAll === true) {
      const defaultReviewerId = parsed.data.reviewerId ?? null;
      const employees = await prisma.employee.findMany({
        where:  { status: 'ACTIVE' },
        select: { id: true },
      });
      pairs = employees.map(e => ({ employeeId: e.id, reviewerId: defaultReviewerId }));
    } else if ('pairs' in parsed.data) {
      pairs = parsed.data.pairs.map(p => ({ employeeId: p.employeeId, reviewerId: p.reviewerId ?? null }));
    } else {
      return errorResponse('VALIDATION_ERROR', 'Provide either assignAll or pairs', 400, correlationId);
    }

    // createMany with skipDuplicates: the (cycleId, employeeId) unique
    // index swallows pre-existing rows so re-runs just top up new hires.
    const result = await prisma.performanceReview.createMany({
      data: pairs.map(p => ({
        cycleId:    cycle.id,
        employeeId: p.employeeId,
        reviewerId: p.reviewerId,
        status:     'PENDING',
      })),
      skipDuplicates: true,
    });

    return successResponse({
      assignedCount: result.count,
      requestedCount: pairs.length,
    }, correlationId, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Assign failed';
    if (msg.includes('Foreign key')) {
      return errorResponse('BAD_REF', 'One or more employeeId / reviewerId references are invalid', 400, correlationId);
    }
    return errorResponse('ASSIGN_FAILED', msg, 500, correlationId);
  }
});
